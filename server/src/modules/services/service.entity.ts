import { Column, Entity, OneToMany } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { ServiceSpec } from './service-spec.entity'

/** 陪玩服务商品 */
@Entity('services')
export class GameService extends BaseEntity {
  @Column({ length: 64 })
  title: string

  @Column({ length: 128, default: '' })
  subtitle: string

  /** rank 排位 / loot 摸金 / task 任务 / warfare 战场 */
  @Column({ length: 32 })
  category: string

  @Column({ name: 'category_name', length: 32, default: '' })
  categoryName: string

  /** hazard 烽火地带 / warfare 全面战场 */
  @Column({ length: 32 })
  mode: string

  @Column({ name: 'mode_name', length: 32, default: '' })
  modeName: string

  /** hour 按小时 / match 按局 */
  @Column({ name: 'price_unit', length: 16 })
  priceUnit: string

  @Column({ name: 'unit_name', length: 16, default: '' })
  unitName: string

  /** 起步价（分） */
  @Column({ name: 'base_price', type: 'int' })
  basePrice: number

  /** 封面图（小程序 assets 或 CDN） */
  @Column({ length: 255, default: '' })
  cover: string

  @Column({ name: 'cover_gradient', length: 128, default: '' })
  coverGradient: string

  @Column({ name: 'cover_text', length: 32, default: '' })
  coverText: string

  @Column({ type: 'simple-json', nullable: true })
  tags: string[]

  @Column({ name: 'service_rules', type: 'simple-json', nullable: true })
  serviceRules: string[]

  @Column({ type: 'simple-json', nullable: true })
  notice: string[]

  @Column({ type: 'int', default: 0 })
  sales: number

  @Column({ type: 'float', default: 5 })
  rating: number

  @Column({ name: 'is_on_sale', type: 'boolean', default: true })
  isOnSale: boolean

  @OneToMany(() => ServiceSpec, (spec) => spec.service, { cascade: true })
  specs: ServiceSpec[]
}
