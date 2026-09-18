import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GameService } from './service.entity'
import { ServiceSpec } from './service-spec.entity'
import { ServicesService } from './services.service'
import { ServicesController } from './services.controller'
import { BannersModule } from '../banners/banners.module'

@Module({
  imports: [TypeOrmModule.forFeature([GameService, ServiceSpec]), BannersModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService]
})
export class ServicesModule {}
