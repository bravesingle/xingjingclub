import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { FundService } from './fund.service'
import { WithdrawDto } from './dto/withdraw.dto'

@ApiTags('资金（打手端）')
@Controller('booster')
export class FundController {
  constructor(private readonly fundService: FundService) {}

  @Post('deposit/pay')
  @ApiOperation({ summary: '缴纳押金（开发期直接标记已缴纳）' })
  payDeposit(@CurrentUser('userId') userId: number) {
    return this.fundService.payDeposit(userId)
  }

  @Get('wallet')
  @ApiOperation({ summary: '打手钱包（可提现余额/冻结/总收入/押金状态）' })
  wallet(@CurrentUser('userId') userId: number) {
    return this.fundService.wallet(userId)
  }

  @Post('withdraw')
  @ApiOperation({ summary: '申请提现' })
  withdraw(@CurrentUser('userId') userId: number, @Body() dto: WithdrawDto) {
    return this.fundService.withdraw(userId, dto)
  }
}
