import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { OrdersService } from './orders.service'
import { ApplyRefundDto, CreateOrderDto, QueryOrdersDto } from './dto/order.dto'

@ApiTags('订单（小程序端）')
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders')
  @ApiOperation({ summary: '创建订单' })
  create(@CurrentUser('userId') userId: number, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(userId, dto)
  }

  @Get('orders')
  @ApiOperation({ summary: '我的订单列表（状态筛选/分页）' })
  list(@CurrentUser('userId') userId: number, @Query() query: QueryOrdersDto) {
    return this.ordersService.listMine(userId, {
      status: query.status,
      page: query.page,
      pageSize: query.pageSize
    })
  }

  @Get('orders/counts')
  @ApiOperation({ summary: '我的订单统计（待支付/服务中/已完成）' })
  counts(@CurrentUser('userId') userId: number) {
    return this.ordersService.getCounts(userId)
  }

  @Get('orders/:id')
  @ApiOperation({ summary: '订单详情' })
  detail(@CurrentUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getMine(userId, id)
  }

  @Post('orders/:id/cancel')
  @ApiOperation({ summary: '取消订单（待支付/已支付）' })
  cancel(@CurrentUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.cancelMine(userId, id)
  }

  @Post('orders/:id/complete')
  @ApiOperation({ summary: '确认完成（服务中）' })
  complete(@CurrentUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.completeMine(userId, id)
  }

  @Post('orders/:id/refund')
  @ApiOperation({ summary: '申请退款（已支付/服务中/已完成）' })
  refund(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApplyRefundDto
  ) {
    return this.ordersService.applyRefundMine(userId, id, dto)
  }

  @Post('booster/orders/:id/accept')
  @ApiOperation({ summary: '打手接单（需交押金，paid → 服务中，绑定聊天双方）' })
  accept(@CurrentUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.acceptByBooster(userId, id)
  }

  @Get('booster/orders/pool')
  @ApiOperation({ summary: '打手工作台：待接单订单池' })
  pool() {
    return this.ordersService.poolList()
  }

  @Get('booster/orders/mine')
  @ApiOperation({ summary: '打手工作台：我的已接订单' })
  mine(@CurrentUser('userId') userId: number) {
    return this.ordersService.listByBoosterForUser(userId)
  }
}
