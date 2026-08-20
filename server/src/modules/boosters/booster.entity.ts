import { Column, Entity, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

/** 打手（陪玩师） */
@Entity('boosters')
export class Booster extends BaseEntity {
  @Column({ length: 64 })
  name: string

  @Column({ length: 255, default: '' })
  avatar: string

  /** 手机号（用于登录身份匹配，后台录入） */
  @Index()
  @Column({ length: 20, default: '' })
  phone: string

  /** 关联用户（打手登录后绑定） */
  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null

  /** 是否已交押金（交押金后才能接单/提现） */
  @Column({ type: 'boolean', default: false })
  deposited: boolean

  /** 收款方式：wechat 微信 / bank 银行卡 */
  @Column({ name: 'withdraw_channel', length: 16, default: 'wechat' })
  withdrawChannel: string

  /** 收款账号（微信号/银行卡号） */
  @Column({ name: 'withdraw_account', length: 128, default: '' })
  withdrawAccount: string

  /** 擅长分类 rank/loot/task/warfare */
  @Column({ type: 'simple-json', nullable: true })
  categories: string[]

  @Column({ type: 'simple-json', nullable: true })
  categoryNames: string[]

  @Column({ length: 16, default: 'hazard' })
  mode: string

  @Column({ length: 32, default: '' })
  rank: string

  @Column({ type: 'float', default: 5 })
  rating: number

  @Column({ name: 'order_count', type: 'int', default: 0 })
  orderCount: number

  /** 是否上线 */
  @Column({ type: 'boolean', default: false })
  online: boolean

  /** 是否接单中 */
  @Column({ type: 'boolean', default: false })
  accepting: boolean

  /** pending 待审核 / approved 已通过 / rejected 已驳回 */
  @Column({ length: 16, default: 'pending' })
  audit: string

  @Column({ name: 'joined_at', type: 'bigint', nullable: true })
  joinedAt: number | null

  @Column({ length: 255, default: '' })
  remark: string
}
