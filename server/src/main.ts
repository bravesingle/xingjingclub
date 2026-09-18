import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { WsAdapter } from '@nestjs/platform-ws'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Reflector } from '@nestjs/core'
import { join } from 'path'
import { AppModule } from './app.module'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

async function bootstrap() {
  // rawBody: true → 保留请求原始报文（req.rawBody），微信支付回调验签需要原始 body 计算签名
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true })

  // WebSocket 适配器（聊天用，小程序 wx.connectSocket 直连 ws://）
  app.useWebSocketAdapter(new WsAdapter(app))

  // 上传图片静态访问：/uploads/xxx.png → server/uploads/
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' })

  // 统一前缀 /api（Swagger 文档在 /api/docs）
  app.setGlobalPrefix('api')

  // 跨域：小程序原生请求无 Origin（放行）；管理后台仅允许白名单（CORS_ORIGINS 逗号分隔）
  // 支持 .domain 子域通配（如 .trycloudflare.com 匹配任意 Cloudflare 临时隧道域名）
  const corsOrigins = (
    process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,.trycloudflare.com'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const isAllowedOrigin = (origin: string | undefined): boolean => {
    if (!origin) return true
    if (corsOrigins.includes(origin)) return true
    return corsOrigins.some((o) => o.startsWith('.') && origin.endsWith(o))
  }
  app.enableCors({
    // 非白名单：不发 CORS 头但放行请求（同源代理下浏览器不校验 CORS，请求正常处理；
    // 真正的跨源浏览器请求因无 CORS 头被浏览器拦截，安全等价且不刷错误日志）
    origin: (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) => {
      cb(null, isAllowedOrigin(origin))
    },
    credentials: true
  })

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
  // @SkipTransform() 的路由（微信支付回调）跳过包装，原样返回
  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()))
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
