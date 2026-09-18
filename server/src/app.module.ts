import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { APP_GUARD } from '@nestjs/core'
import { RedisModule } from './redis/redis.module'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { User } from './modules/users/user.entity'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { ServicesModule } from './modules/services/services.module'
import { OrdersModule } from './modules/orders/orders.module'
import { PayModule } from './modules/pay/pay.module'
import { BoostersModule } from './modules/boosters/boosters.module'
import { StatsModule } from './modules/stats/stats.module'
import { SettingsModule } from './modules/settings/settings.module'
import { AdminModule } from './modules/admin/admin.module'
import { UploadModule } from './modules/upload/upload.module'
import { ChatModule } from './modules/chat/chat.module'
import { FundModule } from './modules/fund/fund.module'
import { BannersModule } from './modules/banners/banners.module'

@Module({
  imports: [
    // 环境变量（全局）
    ConfigModule.forRoot({ isGlobal: true }),

    // MySQL（TypeORM）
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', '127.0.0.1'),
        port: Number(config.get('DB_PORT', 3306)),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_DATABASE', 'xingjing'),
        charset: 'utf8mb4',
        autoLoadEntities: true,
        // 开发期自动同步表结构；生产环境必须设 DB_SYNCHRONIZE=false 并改用 migration
        synchronize: config.get('DB_SYNCHRONIZE', 'true') === 'true',
        logging: false
      })
    }),

    // JWT（全局，auth 与 admin 共用）
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // 安全：JWT_SECRET 必须显式配置，缺失直接启动报错（不回退硬编码弱默认）
        const secret = config.get<string>('JWT_SECRET')
        if (!secret) {
          throw new Error('JWT_SECRET 环境变量未配置，请检查 .env（生产环境必须为强随机值）')
        }
        if (config.get('NODE_ENV') === 'production') {
          if (secret.length < 32 || secret === 'xingjing-esports-change-me') {
            throw new Error('生产环境 JWT_SECRET 过弱，请设置至少 32 位的强随机值')
          }
        }
        return {
          secret,
          signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') }
        }
      }
    }),

    // 供全局 JWT 守卫校验用户封禁状态
    TypeOrmModule.forFeature([User]),

    RedisModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    OrdersModule,
    PayModule,
    BoostersModule,
    StatsModule,
    SettingsModule,
    AdminModule,
    UploadModule,
    ChatModule,
    FundModule,
    BannersModule
  ],
  providers: [
    // 全局 JWT 认证：接口默认需登录，@Public() 放行
    { provide: APP_GUARD, useClass: JwtAuthGuard }
  ]
})
export class AppModule {}
