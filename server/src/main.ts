import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { WsAdapter } from '@nestjs/platform-ws'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { join } from 'path'
import { AppModule } from './app.module'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // WebSocket 适配器（聊天用，小程序 wx.connectSocket 直连 ws://）
  app.useWebSocketAdapter(new WsAdapter(app))

  // 上传图片静态访问：/uploads/xxx.png → server/uploads/
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' })

  // 统一前缀 /api（Swagger 文档在 /api/docs）
  app.setGlobalPrefix('api')

  // 跨域（管理后台 dev 在 localhost:5173）
  app.enableCors({ origin: true, credentials: true })

  // DTO 校验：剥离多余字段 + 类型转换
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: true
    })
  )

  // 统一响应 { code, data, msg }，与小程序 utils/request.js 契约一致
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalFilters(new AllExceptionsFilter())

  // Swagger 接口文档
  const config = new DocumentBuilder()
    .setTitle('星竞电竞 API')
    .setDescription('三角洲行动陪玩服务 · 小程序端 + 管理端接口文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = Number(process.env.PORT) || 3000
  await app.listen(port)
  Logger.log(`🚀 星竞电竞后端已启动: http://localhost:${port}/api`, 'Bootstrap')
  Logger.log(`📖 Swagger 文档: http://localhost:${port}/api/docs`, 'Bootstrap')
}
bootstrap()
