import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AdminGuard } from '../../common/guards/admin.guard'
import { ChatService } from './chat.service'

@ApiTags('管理端 · 聊天查看')
@UseGuards(AdminGuard)
@Controller('admin/chat')
export class AdminChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':orderId/history')
  @ApiOperation({ summary: '后台查看订单聊天记录（只读，含发送者名称）' })
  history(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.chatService.getHistoryWithNames(orderId)
  }
}
