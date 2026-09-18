import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { BoostersService } from './boosters.service'

@ApiTags('打手（小程序端，P2）')
@Public()
@Controller('boosters')
export class BoostersController {
  constructor(private readonly boostersService: BoostersService) {}

  @Get()
  @ApiOperation({ summary: '可接单打手列表（已审核 + 在线）' })
  list(@Query('keyword') keyword?: string) {
    return this.boostersService.listForUser(keyword || '')
  }

  @Get(':id')
  @ApiOperation({ summary: '可接单打手详情' })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.boostersService.getForUser(id)
  }
}
