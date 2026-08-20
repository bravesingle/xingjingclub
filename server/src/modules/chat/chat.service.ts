import { ForbiddenException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { ChatMessage } from './chat-message.entity'
import { Order } from '../orders/order.entity'
import { User } from '../users/user.entity'
import { Booster } from '../boosters/booster.entity'

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly msgRepo: Repository<ChatMessage>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Booster)
    private readonly boosterRepo: Repository<Booster>
  ) {}

  /** 校验当前用户是否为订单参与方：订单玩家 或 订单打手 */
  async canAccess(orderId: number, userId: number): Promise<boolean> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) return false
    if (order.userId === userId) return true
    const user = await this.userRepo.findOne({ where: { id: userId } })
    return !!(user && user.boosterId && order.boosterId && order.boosterId === user.boosterId)
  }

  /** 发送者真实角色（player / booster） */
  async getUserRole(userId: number): Promise<string> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    return user && user.role === 'booster' ? 'booster' : 'player'
  }

  /** 落库消息 */
  async save(orderId: number, senderId: number, senderRole: string, content: string, type = 'text'): Promise<ChatMessage> {
    const msg = this.msgRepo.create({
      orderId,
      senderId,
      senderRole,
      type: type || 'text',
      content: String(content || ''),
      sentAt: Date.now()
    })
    return this.msgRepo.save(msg)
  }

  /** 聊天历史（升序） */
  async getHistory(orderId: number): Promise<ChatMessage[]> {
    return this.msgRepo.find({ where: { orderId }, order: { sentAt: 'ASC' } })
  }

  /** 后台查看：聊天历史 + 发送者名称（打手名 / 玩家昵称） */
  async getHistoryWithNames(orderId: number) {
    const list = await this.getHistory(orderId)
    if (!list.length) return []
    const userIds = [...new Set(list.map((m) => m.senderId))]
    const users = await this.userRepo.find({ where: { id: In(userIds) } })
    const userMap = new Map(users.map((u) => [u.id, u]))
    const boosterIds = [...new Set(users.filter((u) => u.boosterId).map((u) => u.boosterId))]
    const boosters = boosterIds.length
      ? await this.boosterRepo.find({ where: { id: In(boosterIds) } })
      : []
    const boosterMap = new Map(boosters.map((b) => [b.id, b]))
    return list.map((m) => {
      const user = userMap.get(m.senderId)
      let senderName = user ? user.nickname || '' : ''
      if (m.senderRole === 'booster' && user && user.boosterId) {
        const booster = boosterMap.get(user.boosterId)
        senderName = booster ? booster.name : senderName
      }
      return { ...m, senderName }
    })
  }

  /** 断言可访问（REST 接口用），无权则抛异常 */
  async assertAccess(orderId: number, userId: number): Promise<void> {
    const ok = await this.canAccess(orderId, userId)
    if (!ok) throw new ForbiddenException('无权访问该订单聊天')
  }
}
