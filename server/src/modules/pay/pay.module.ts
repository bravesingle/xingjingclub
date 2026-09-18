import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from '../orders/order.entity'
import { Booster } from '../boosters/booster.entity'
import { Deposit } from '../fund/deposit.entity'
import { SettingsModule } from '../settings/settings.module'
import { PayService } from './pay.service'
import { PayController } from './pay.controller'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Booster, Deposit]),
    UsersModule,
    SettingsModule
  ],
  controllers: [PayController],
  providers: [PayService],
  exports: [PayService]
})
export class PayModule {}
