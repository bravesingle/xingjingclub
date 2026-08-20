import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from '../orders/order.entity'
import { User } from '../users/user.entity'
import { StatsService } from './stats.service'

@Module({
  imports: [TypeOrmModule.forFeature([Order, User])],
  providers: [StatsService],
  exports: [StatsService]
})
export class StatsModule {}
