import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { ChatService } from './chat.service'

@ApiTags('聊天（小程序端）')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':orderId/history')
  @ApiOperation({ summary: '订单聊天历史（玩家/订单打手）' })
  async history(@CurrentUser('userId') userId: number, @Param('orderId', ParseIntPipe) orderId: number) {
    await this.chatService.assertAccess(orderId, userId)
    return { list: await this.chatService.getHistory(orderId) }
  }
}
