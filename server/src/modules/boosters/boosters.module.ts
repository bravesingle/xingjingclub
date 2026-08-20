import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Booster } from './booster.entity'
import { User } from '../users/user.entity'
import { Deposit } from '../fund/deposit.entity'
import { Income } from '../fund/income.entity'
import { Withdrawal } from '../fund/withdrawal.entity'
import { BoostersService } from './boosters.service'
import { BoostersController } from './boosters.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Booster, User, Deposit, Income, Withdrawal])],
  controllers: [BoostersController],
  providers: [BoostersService],
  exports: [BoostersService]
})
export class BoostersModule {}
