import { Column, Entity } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

/**
 * 首页 Banner（管理后台可增删）
 * linkType: service 跳服务详情 / category 跳分类列表 / page 跳指定页面
 * cover: 图片地址（有图优先显示，无图用 gradient 渐变占位）
 */
@Entity('banners')
export class Banner extends BaseEntity {
  @Column({ length: 64 })
  title: string

  @Column({ length: 128, default: '' })
  subtitle: string

  /** 封面图（相对路径 /uploads/xxx 或完整 URL） */
  @Column({ length: 255, default: '' })
  cover: string

  /** 无图时的渐变背景 */
  @Column({ length: 128, default: '' })
  gradient: string

  @Column({ name: 'link_type', length: 16, default: 'service' })
  linkType: string

  @Column({ name: 'link_id', length: 64, default: '' })
  linkId: string

  /** 排序（越小越靠前） */
  @Column({ type: 'int', default: 0 })
  sort: number
}
