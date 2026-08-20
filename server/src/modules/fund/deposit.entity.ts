import { Column, Entity, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

/**
 * 打手押金记录
 * status: pending 待支付 / paid 已缴纳 / refunded 已退还
 */
@Entity('deposits')
export class Deposit extends BaseEntity {
  @Index()
  @Column({ name: 'booster_id', type: 'int' })
  boosterId: number

  /** 押金金额（分） */
  @Column({ type: 'int' })
  amount: number

  @Column({ length: 16, default: 'pending' })
  status: string

  @Column({ name: 'paid_at', type: 'bigint', nullable: true })
  paidAt: number | null

  @Column({ name: 'refunded_at', type: 'bigint', nullable: true })
  refundedAt: number | null
}
