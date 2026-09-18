import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Banner } from './banner.entity'
import { GameService } from '../services/service.entity'
import { BannersService } from './banners.service'
import { AdminBannersController } from './admin-banners.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Banner, GameService])],
  controllers: [AdminBannersController],
  providers: [BannersService],
  exports: [BannersService]
})
export class BannersModule {}
