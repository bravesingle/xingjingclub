import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AdminGuard } from '../../common/guards/admin.guard'
import { SuperAdminGuard } from '../../common/guards/super-admin.guard'
import { ServicesService } from '../services/services.service'
import { CreateServiceDto, UpdateServiceDto } from '../services/dto/service.dto'
import { AdminQueryDto, BatchDeleteDto } from './dto/admin.dto'

@ApiTags('管理端 · 服务商品')
@UseGuards(AdminGuard)
@Controller('admin/services')
export class AdminServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: '服务列表（含下架，关键词/上下架筛选）' })
  list(@Query() query: AdminQueryDto) {
    return this.servicesService.adminList({
      keyword: query.keyword,
      page: query.page,
      pageSize: query.pageSize,
      onSale: query.onSale === undefined ? undefined : query.onSale === 1
    })
  }

  @Post()
  @ApiOperation({ summary: '新增服务' })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑服务' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto)
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: '上架/下架切换' })
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.toggleOnSale(id)
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '删除服务（仅超级管理员）' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.remove(id)
  }

  @Post('batch-delete')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '批量删除服务（仅超级管理员）' })
  batchRemove(@Body() dto: BatchDeleteDto) {
    return this.servicesService.batchRemove(dto.ids)
  }
}
