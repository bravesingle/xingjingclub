import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Deposit } from './deposit.entity'
import { Income } from './income.entity'
import { Withdrawal } from './withdrawal.entity'
import { ActivationCode } from './activation-code.entity'
import { RechargeRecord } from './recharge-record.entity'
import { PlatformIncome } from './platform-income.entity'
import { Booster } from '../boosters/booster.entity'
import { User } from '../users/user.entity'
import { Order } from '../orders/order.entity'
import { SettingsModule } from '../settings/settings.module'
import { FundService } from './fund.service'
import { FundController } from './fund.controller'
import { UserBalanceController } from './user-balance.controller'
import { AdminFundController } from './admin-fund.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([Deposit, Income, Withdrawal, ActivationCode, RechargeRecord, PlatformIncome, Booster, User, Order]),
    SettingsModule
  ],
  controllers: [FundController, UserBalanceController, AdminFundController],
  providers: [FundService],
  exports: [FundService]
})
export class FundModule {}
