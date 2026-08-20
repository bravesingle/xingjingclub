import { Column, Entity, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

/**
 * 用户余额充值记录
 * channel: mock 模拟充值 / code 激活码兑换
 */
@Entity('recharge_records')
export class RechargeRecord extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'int' })
  userId: number

  /** 金额（分） */
  @Column({ type: 'int' })
  amount: number

  @Column({ length: 16, default: 'mock' })
  channel: string

  @Column({ name: 'code_id', type: 'int', nullable: true })
  codeId: number | null
}
