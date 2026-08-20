import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Admin } from './admin.entity'
import { AdminService } from './admin.service'
import { AdminAuthController } from './admin-auth.controller'
import { AdminServicesController } from './admin-services.controller'
import { AdminOrdersController } from './admin-orders.controller'
import { AdminUsersController } from './admin-users.controller'
import { AdminBoostersController } from './admin-boosters.controller'
import { AdminStatsController } from './admin-stats.controller'
import { AdminSettingsController } from './admin-settings.controller'
import { ServicesModule } from '../services/services.module'
import { OrdersModule } from '../orders/orders.module'
import { UsersModule } from '../users/users.module'
import { BoostersModule } from '../boosters/boosters.module'
import { StatsModule } from '../stats/stats.module'
import { SettingsModule } from '../settings/settings.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    ServicesModule,
    OrdersModule,
    UsersModule,
    BoostersModule,
    StatsModule,
    SettingsModule
  ],
  controllers: [
    AdminAuthController,
    AdminServicesController,
    AdminOrdersController,
    AdminUsersController,
    AdminBoostersController,
    AdminStatsController,
    AdminSettingsController
  ],
  providers: [AdminService],
  exports: [AdminService]
})
export class AdminModule {}
