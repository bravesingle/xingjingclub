import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AdminGuard } from '../../common/guards/admin.guard'
import { StatsService } from '../stats/stats.service'
import { BoostersService } from '../boosters/boosters.service'

@ApiTags('管理端 · 统计')
@UseGuards(AdminGuard)
@Controller('admin/stats')
export class AdminStatsController {
  constructor(
    private readonly statsService: StatsService,
    private readonly boostersService: BoostersService
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: '统计看板：订单/销售额/状态分布/14天趋势 + 打手概览' })
  async dashboard() {
    const stats = await this.statsService.dashboard()
    const booster = await this.boostersService.stats()
    return { ...stats, booster }
  }
}
