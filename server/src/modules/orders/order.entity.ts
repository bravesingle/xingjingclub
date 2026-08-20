import { Column, Entity, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

/**
 * 订单
 * 状态机：pending_pay → paid → in_progress → completed
 *        pending_pay/paid → cancelled
 *        paid/in_progress/completed → refunding → refunded（驳回则回 refundFrom）
 */
@Entity('orders')
export class Order extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'order_no', length: 40 })
  orderNo: string

  @Index()
  @Column({ name: 'user_id', type: 'int' })
  userId: number

  @Column({ name: 'service_id', type: 'int' })
  serviceId: number

  @Column({ name: 'service_title', length: 64 })
  serviceTitle: string

  @Column({ length: 64, default: '' })
  subtitle: string

  @Column({ name: 'mode_name', length: 32, default: '' })
  modeName: string

  @Column({ name: 'cover_gradient', length: 128, default: '' })
  coverGradient: string

  @Column({ name: 'cover_text', length: 32, default: '' })
  coverText: string

  @Column({ name: 'spec_label', length: 32 })
  specLabel: string

  @Column({ name: 'spec_value', type: 'int' })
  specValue: number

  @Column({ type: 'int' })
  quantity: number

  @Column({ name: 'unit_price', type: 'int' })
  unitPrice: number

  /** 实付金额（分） */
  @Column({ type: 'int' })
  amount: number

  @Index()
  @Column({ length: 24, default: 'pending_pay' })
  status: string

  @Column({ type: 'text', nullable: true })
  remark: string

  @Column({ length: 64, default: '' })
  contact: string

  /** 打手昵称（派单后填充） */
  @Column({ name: 'serve_by', length: 64, default: '' })
  serveBy: string

  /** 接单打手 ID（派单后填充，聊天/结算用） */
  @Column({ name: 'booster_id', type: 'int', nullable: true })
  boosterId: number | null

  /** 该单抽成比例（%），下单时快照全局设置，可后台单独修改 */
  @Column({ name: 'platform_rate', type: 'int', default: 0 })
  platformRate: number

  /** 以下时间戳存毫秒（bigint） */
  @Column({ name: 'pay_expire_at', type: 'bigint', nullable: true })
  payExpireAt: number | null

  @Column({ name: 'paid_at', type: 'bigint', nullable: true })
  paidAt: number | null

  @Column({ name: 'started_at', type: 'bigint', nullable: true })
  startedAt: number | null

  @Column({ name: 'completed_at', type: 'bigint', nullable: true })
  completedAt: number | null

  @Column({ name: 'cancelled_at', type: 'bigint', nullable: true })
  cancelledAt: number | null

  @Column({ name: 'refund_reason', length: 255, default: '' })
  refundReason: string

  /** 申请退款前的状态（驳回时退回） */
  @Column({ name: 'refund_from', length: 24, default: '' })
  refundFrom: string

  @Column({ name: 'refunded_at', type: 'bigint', nullable: true })
  refundedAt: number | null

  @Column({ name: 'refund_rejected_at', type: 'bigint', nullable: true })
  refundRejectedAt: number | null
}
