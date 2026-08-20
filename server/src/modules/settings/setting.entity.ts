import { Column, Entity } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

/** 系统设置（key-value，value 为 JSON 字符串） */
@Entity('settings')
export class Setting extends BaseEntity {
  @Column({ unique: true, length: 64 })
  key: string

  @Column({ type: 'text' })
  value: string
}
