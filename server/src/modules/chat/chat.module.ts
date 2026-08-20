import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChatMessage } from './chat-message.entity'
import { Order } from '../orders/order.entity'
import { User } from '../users/user.entity'
import { Booster } from '../boosters/booster.entity'
import { ChatService } from './chat.service'
import { ChatGateway } from './chat.gateway'
import { ChatController } from './chat.controller'
import { AdminChatController } from './admin-chat.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, Order, User, Booster])],
  controllers: [ChatController, AdminChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService]
})
export class ChatModule {}
