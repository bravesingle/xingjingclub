import { Column, Entity } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

/** 后台管理员 */
@Entity('admins')
export class Admin extends BaseEntity {
  @Column({ unique: true, length: 32 })
  username: string

  /** bcrypt 哈希 */
  @Column({ name: 'password_hash', length: 128 })
  passwordHash: string

  @Column({ length: 32, default: '管理员' })
  name: string

  @Column({ length: 16, default: 'admin' })
  role: string

  @Column({ name: 'last_login_at', type: 'bigint', nullable: true })
  lastLoginAt: number | null
}
