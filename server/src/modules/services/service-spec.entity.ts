import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { GameService } from './service.entity'

/** 服务规格（按时长/局数，长时折扣） */
@Entity('service_specs')
export class ServiceSpec extends BaseEntity {
  @Column({ name: 'service_id', type: 'int' })
  serviceId: number

  @ManyToOne(() => GameService, (service) => service.specs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: GameService

  /** 规格值（小时数或局数） */
  @Column({ type: 'int' })
  value: number

  @Column({ length: 32 })
  label: string

  /** 价格（分） */
  @Column({ type: 'int' })
  price: number
}
