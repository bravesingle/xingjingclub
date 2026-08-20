import { Column, Entity, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

/**
 * 订单内聊天消息（打手 ↔ 玩家）
 * senderRole: player / booster
 */
@Entity('chat_messages')
export class ChatMessage extends BaseEntity {
  @Index()
  @Column({ name: 'order_id', type: 'int' })
  orderId: number

  @Column({ name: 'sender_id', type: 'int' })
  senderId: number

  @Column({ name: 'sender_role', length: 16 })
  senderRole: string

  /** text 文字 / image 图片 */
  @Column({ length: 16, default: 'text' })
  type: string

  @Column({ type: 'text' })
  content: string

  /** 毫秒时间戳（精确排序） */
  @Column({ name: 'sent_at', type: 'bigint', default: 0 })
  sentAt: number
}
