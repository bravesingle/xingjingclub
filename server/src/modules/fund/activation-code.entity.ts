import { Column, Entity, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

/**
 * 激活码（后台生成，用户兑换获取余额）
 * status: unused 未使用 / used 已使用
 */
@Entity('activation_codes')
export class ActivationCode extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 32 })
  code: string

  /** 面额（分） */
  @Column({ type: 'int' })
  amount: number

  @Column({ length: 16, default: 'unused' })
  status: string

  @Column({ name: 'used_by', type: 'int', nullable: true })
  usedBy: number | null

  @Column({ name: 'used_at', type: 'bigint', nullable: true })
  usedAt: number | null
}
