import { Column, Entity, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

/**
 * 平台抽成收入（每笔订单的平台抽成金额，累计即平台账户余额）
 */
@Entity('platform_incomes')
export class PlatformIncome extends BaseEntity {
  @Index()
  @Column({ name: 'order_id', type: 'int' })
  orderId: number

  /** 平台抽成金额（分） */
  @Column({ type: 'int' })
  amount: number
}
