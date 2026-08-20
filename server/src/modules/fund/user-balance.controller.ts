import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { FundService } from './fund.service'
import { RechargeDto, RedeemDto } from './dto/balance.dto'

@ApiTags('用户余额（小程序端）')
@Controller()
export class UserBalanceController {
  constructor(private readonly fundService: FundService) {}

  @Post('user/recharge')
  @ApiOperation({ summary: '用户充值（开发期 mock 直接入账）' })
  recharge(@CurrentUser('userId') userId: number, @Body() dto: RechargeDto) {
    return this.fundService.recharge(userId, dto.amount)
  }

  @Post('user/redeem')
  @ApiOperation({ summary: '兑换激活码获取余额' })
  redeem(@CurrentUser('userId') userId: number, @Body() dto: RedeemDto) {
    return this.fundService.redeem(userId, dto.code.trim())
  }
}
