import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AdminGuard } from '../../common/guards/admin.guard'
import { SuperAdminGuard } from '../../common/guards/super-admin.guard'
import { OrdersService } from '../orders/orders.service'
import { AdminQueryDto, OrderActionDto } from './dto/admin.dto'

@ApiTags('管理端 · 订单')
@UseGuards(AdminGuard)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: '订单列表（状态/关键词/分页）' })
  list(@Query() query: AdminQueryDto) {
    return this.ordersService.adminList({
      status: query.status,
      keyword: query.keyword,
      page: query.page,
      pageSize: query.pageSize
    })
  }

  @Get(':id')
  @ApiOperation({ summary: '订单详情' })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.adminGet(id)
  }

  @Post(':id/action')
  @ApiOperation({ summary: '状态流转：cancel/start/complete/approve_refund/reject_refund' })
  action(@Param('id', ParseIntPipe) id: number, @Body() dto: OrderActionDto) {
    return this.ordersService.adminAction(id, dto.action)
  }

  @Post(':id/rate')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '修改单笔订单抽成比例（仅超级管理员）' })
  updateRate(@Param('id', ParseIntPipe) id: number, @Body('platformRate') platformRate: number) {
    return this.ordersService.updateRate(id, platformRate)
  }
}
