import { BadRequestException, Body, Controller, Get, Logger, Post, Query, Req } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { SkipTransform } from '../../common/decorators/skip-transform.decorator'
import { PayService } from './pay.service'
import { WechatPayClient } from './wechat-pay.client'

@ApiTags('支付（小程序端）')
@Controller('pay')
export class PayController {
  private readonly logger = new Logger('PayNotify')

  constructor(private readonly payService: PayService) {}

  @Post('wechat/prepay')
  @ApiOperation({ summary: '微信支付预下单（PAY_MOCK=true 时返回 mock 标记）' })
  prepay(@CurrentUser('userId') userId: number, @Body('orderId') orderId: number) {
    return this.payService.createPayment(orderId, userId)
  }

  @Post('wechat/deposit')
  @ApiOperation({ summary: '保证金支付预下单（陪玩师缴纳保证金）' })
  depositPrepay(@CurrentUser('userId') userId: number) {
    return this.payService.createDepositPayment(userId)
  }

  @Post('mock')
  @ApiOperation({ summary: '模拟支付（仅开发期）' })
  mockPay(@CurrentUser('userId') userId: number, @Body('orderId') orderId: number) {
    return this.payService.mockPay(orderId, userId)
  }

  @Post('balance')
  @ApiOperation({ summary: '余额支付（扣余额 → 订单已支付）' })
  balancePay(@CurrentUser('userId') userId: number, @Body('orderId') orderId: number) {
    return this.payService.payByBalance(orderId, userId)
  }

  @Get('result')
  @ApiOperation({ summary: '查询支付结果' })
  result(@CurrentUser('userId') userId: number, @Query('orderId') orderId: string) {
    return this.payService.queryPayResult(Number(orderId), userId)
  }

  /**
   * 微信支付结果回调（微信服务器 → 本接口）
   * - 无需登录（@Public 放行全局 JWT 守卫）
   * - @SkipTransform：微信要求应答报文体为 {"code":"SUCCESS"}，必须绕过全局 {code,data,msg} 包装
   * - 验签用 req.rawBody（main.ts 开启 rawBody:true）；业务失败抛错返回非200 → 微信自动重试
   */
  @Public()
  @SkipTransform()
  @Post('wechat/notify')
  @ApiOperation({ summary: '微信支付结果回调（微信服务器调用，无需登录）' })
  async notify(@Req() req: Request) {
    try {
      // 原始报文：签名基于「收到的原始字节」，不能使用被 JSON 解析后的对象
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody
      const bodyStr = rawBody ? rawBody.toString('utf8') : ''
      if (!bodyStr) throw new BadRequestException('空回调')

      const wx = new WechatPayClient(process.env)
      const notify = wx.verifyAndDecryptNotify(req.headers as Record<string, any>, bodyStr)
      const result = await this.payService.handleNotify(notify)
      if (!result.handled) {
        // 业务校验失败（如金额不符）：返回非200让微信重试，便于日志追踪
        this.logger.error('微信回调业务处理失败: ' + (result.msg || ''))
        throw new BadRequestException(result.msg || '处理失败')
      }
      return { code: 'SUCCESS', message: '成功' }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '回调处理异常'
      this.logger.error('微信回调处理失败: ' + msg)
      throw new BadRequestException(msg)
    }
  }
}
