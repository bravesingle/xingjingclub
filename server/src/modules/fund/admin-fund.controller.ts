import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AdminGuard } from '../../common/guards/admin.guard'
import { FundService } from './fund.service'
import { GenerateCodesDto, RechargeDto } from './dto/balance.dto'

@ApiTags('管理端 · 资金')
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminFundController {
  constructor(private readonly fundService: FundService) {}

  @Get('withdrawals')
  @ApiOperation({ summary: '提现列表（status: all/pending/approved/rejected）' })
  withdrawals(@Query('status') status: string) {
    return this.fundService.adminWithdrawals(status)
  }

  @Post('withdrawals/:id/approve')
  @ApiOperation({ summary: '同意打款' })
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.fundService.adminApproveWithdrawal(id)
  }

  @Post('withdrawals/:id/reject')
  @ApiOperation({ summary: '驳回提现（金额自动回到可提现余额）' })
  reject(@Param('id', ParseIntPipe) id: number, @Body('reason') reason: string) {
    return this.fundService.adminRejectWithdrawal(id, reason)
  }

  @Get('deposits')
  @ApiOperation({ summary: '押金记录列表' })
  deposits() {
    return this.fundService.adminDeposits()
  }

  @Post('codes/generate')
  @ApiOperation({ summary: '生成激活码（amount 分，count 数量）' })
  generateCodes(@Body() dto: GenerateCodesDto) {
    return this.fundService.generateCodes(dto.amount, dto.count)
  }

  @Get('codes')
  @ApiOperation({ summary: '激活码列表（status: all/unused/used）' })
  codes(@Query('status') status: string) {
    return this.fundService.listCodes(status)
  }

  @Post('users/:id/recharge')
  @ApiOperation({ summary: '后台给指定用户加余额（amount 分）' })
  rechargeUser(@Param('id', ParseIntPipe) id: number, @Body() dto: RechargeDto) {
    return this.fundService.recharge(id, dto.amount)
  }

  @Get('platform/stats')
  @ApiOperation({ summary: '平台抽成账户统计（总收入/订单数/明细）' })
  platformStats() {
    return this.fundService.platformStats()
  }
}
