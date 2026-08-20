import { Column, Entity, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

/**
 * 打手提现申请
 * status: pending 待审核 / approved 已打款 / rejected 已驳回
 */
@Entity('withdrawals')
export class Withdrawal extends BaseEntity {
  @Index()
  @Column({ name: 'booster_id', type: 'int' })
  boosterId: number

  /** 提现金额（分） */
  @Column({ type: 'int' })
  amount: number

  @Column({ length: 16, default: 'pending' })
  status: string

  /** 收款方式（预留：微信/支付宝/银行卡） */
  @Column({ length: 32, default: 'wechat' })
  channel: string

  /** 收款账号（预留） */
  @Column({ length: 128, default: '' })
  account: string

  @Column({ name: 'applied_at', type: 'bigint', default: 0 })
  appliedAt: number

  @Column({ name: 'processed_at', type: 'bigint', nullable: true })
  processedAt: number | null

  /** 驳回原因 */
  @Column({ length: 255, default: '' })
  rejectReason: string
}
