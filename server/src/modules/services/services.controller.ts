import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { ServicesService } from './services.service'
import { QueryServicesDto } from './dto/service.dto'

@ApiTags('服务商品（小程序端）')
@Public()
@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('home/data')
  @ApiOperation({ summary: '首页聚合数据：banner + 分类 + 热门服务' })
  getHomeData() {
    return this.servicesService.getHomeData()
  }

  @Get('services')
  @ApiOperation({ summary: '服务列表（仅上架，支持分类/模式/关键词/排序/分页）' })
  list(@Query() query: QueryServicesDto) {
    return this.servicesService.listForUser(query)
  }

  @Get('services/:id')
  @ApiOperation({ summary: '服务详情（仅上架）' })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.getForUser(id)
  }
}
