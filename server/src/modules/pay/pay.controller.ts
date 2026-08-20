import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { PayService } from './pay.service'

@ApiTags('支付（小程序端）')
@Controller('pay')
export class PayController {
  constructor(private readonly payService: PayService) {}

  @Post('wechat/prepay')
  @ApiOperation({ summary: '微信支付预下单（PAY_MOCK=true 时返回 mock 标记）' })
  prepay(@CurrentUser('userId') userId: number, @Body('orderId') orderId: number) {
    return this.payService.createPayment(orderId, userId)
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
}
