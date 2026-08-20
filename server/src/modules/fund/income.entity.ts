import { Column, Entity, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

/**
 * 打手收入流水（每笔完成订单的收入）
 * status: frozen 冻结中（T+3）/ available 可提现 / withdrawn 已提现
 */
@Entity('incomes')
export class Income extends BaseEntity {
  @Index()
  @Column({ name: 'booster_id', type: 'int' })
  boosterId: number

  @Column({ name: 'order_id', type: 'int' })
  orderId: number

  /** 收入金额（分） */
  @Column({ type: 'int' })
  amount: number

  @Column({ length: 16, default: 'frozen' })
  status: string

  /** 解冻时间（订单完成 + T+3 天） */
  @Column({ name: 'frozen_until', type: 'bigint', nullable: true })
  frozenUntil: number | null

  /** 关联提现记录（已提现时） */
  @Column({ name: 'withdrawal_id', type: 'int', nullable: true })
  withdrawalId: number | null
}
