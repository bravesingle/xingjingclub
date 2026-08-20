import { Column, Entity, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

/** 小程序用户（玩家 / 打手，按 role 区分） */
@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 64 })
  openid: string

  @Column({ length: 64, default: '' })
  nickname: string

  @Column({ length: 255, default: '' })
  avatar: string

  @Column({ name: 'game_id', length: 64, default: '' })
  gameId: string

  /** 手机号（微信授权绑定，用于身份识别） */
  @Index()
  @Column({ length: 20, default: '' })
  phone: string

  /** 角色：player 玩家 / booster 打手 */
  @Column({ length: 16, default: 'player' })
  role: string

  /** 关联打手档案（role=booster 时指向 boosters.id） */
  @Column({ name: 'booster_id', type: 'int', nullable: true })
  boosterId: number | null

  @Column({ type: 'int', default: 1 })
  level: number

  @Column({ type: 'boolean', default: false })
  vip: boolean

  @Column({ type: 'boolean', default: false })
  banned: boolean

  @Column({ name: 'order_count', type: 'int', default: 0 })
  orderCount: number

  @Column({ name: 'total_spend', type: 'int', default: 0 })
  totalSpend: number

  /** 余额（分），充值/激活码获取，可用于支付订单 */
  @Column({ type: 'int', default: 0 })
  balance: number
}
