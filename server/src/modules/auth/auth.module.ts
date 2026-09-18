import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { WechatPhoneService } from './wechat-phone.service'
import { UsersModule } from '../users/users.module'
import { Booster } from '../boosters/booster.entity'

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([Booster])],
  controllers: [AuthController],
  providers: [AuthService, WechatPhoneService],
  exports: [AuthService]
})
export class AuthModule {}
