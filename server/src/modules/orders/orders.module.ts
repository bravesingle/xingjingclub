import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from './order.entity'
import { Booster } from '../boosters/booster.entity'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { ServicesModule } from '../services/services.module'
import { UsersModule } from '../users/users.module'
import { FundModule } from '../fund/fund.module'
import { SettingsModule } from '../settings/settings.module'

@Module({
  imports: [TypeOrmModule.forFeature([Order, Booster]), ServicesModule, UsersModule, FundModule, SettingsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}
