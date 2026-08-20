import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from '../orders/order.entity'
import { PayService } from './pay.service'
import { PayController } from './pay.controller'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [TypeOrmModule.forFeature([Order]), UsersModule],
  controllers: [PayController],
  providers: [PayService],
  exports: [PayService]
})
export class PayModule {}
