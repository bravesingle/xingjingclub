import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets'
import { Server, WebSocket } from 'ws'
import { JwtService } from '@nestjs/jwt'
import { ChatService } from './chat.service'

interface ClientInfo {
  userId: number
  orderId: number
  role: string
}

/**
 * 聊天 WebSocket 网关（ws 适配器，小程序 wx.connectSocket 直连）
 * 流程：连接 → 发 {event:'auth', data:{token, orderId}} → 校验通过加入订单房间
 *       → 发 {event:'message', data:{content, type}} → 落库并广播给同订单在线客户端
 */
@WebSocketGateway({ path: '/chat' })
export class ChatGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private rooms = new Map<number, Set<WebSocket>>()
  private clientInfo = new Map<WebSocket, ClientInfo>()

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService
  ) {}

  @SubscribeMessage('auth')
  async handleAuth(@ConnectedSocket() client: WebSocket, @MessageBody() payload: any) {
    try {
      const user = this.jwtService.verify(payload && payload.token)
      const orderId = Number(payload.orderId)
      const ok = await this.chatService.canAccess(orderId, user.userId)
      if (!ok) {
        this.send(client, 'error', { msg: '无权访问该订单聊天' })
        client.close()
        return
      }
      // 发送者真实角色（player/booster），而非 JWT 的认证角色
      const realRole = await this.chatService.getUserRole(user.userId)
      let room = this.rooms.get(orderId)
      if (!room) {
        room = new Set<WebSocket>()
        this.rooms.set(orderId, room)
      }
      room.add(client)
      this.clientInfo.set(client, { userId: user.userId, orderId, role: realRole })
      this.send(client, 'auth_ok', { orderId })
    } catch (e) {
      this.send(client, 'error', { msg: '认证失败' })
      client.close()
    }
  }

  @SubscribeMessage('message')
  async handleMessage(@ConnectedSocket() client: WebSocket, @MessageBody() payload: any) {
    const info = this.clientInfo.get(client)
    if (!info) return
    const content = String((payload && payload.content) || '').trim()
    if (!content) return
    const msg = await this.chatService.save(info.orderId, info.userId, info.role, content, payload && payload.type)
    const room = this.rooms.get(info.orderId) || new Set()
    room.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) {
        c.send(JSON.stringify({ event: 'message', data: msg }))
      }
    })
  }

  handleDisconnect(client: WebSocket) {
    const info = this.clientInfo.get(client)
    if (info) {
      const room = this.rooms.get(info.orderId)
      if (room) {
        room.delete(client)
        if (room.size === 0) this.rooms.delete(info.orderId)
      }
      this.clientInfo.delete(client)
    }
  }

  private send(client: WebSocket, event: string, data: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event, data }))
    }
  }
}
