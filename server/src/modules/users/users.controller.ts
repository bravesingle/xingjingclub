import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { UsersService } from './users.service'
import { toUserVO } from './user.vo'
import { UpdateUserDto } from './dto/update-user.dto'

@ApiTags('用户')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('user/info')
  @ApiOperation({ summary: '获取当前用户信息' })
  async getInfo(@CurrentUser('userId') userId: number) {
    const user = await this.usersService.findByIdOrFail(userId)
    return toUserVO(user)
  }

  @Post('user/info')
  @ApiOperation({ summary: '更新当前用户资料（昵称/游戏ID）' })
  async updateInfo(@CurrentUser('userId') userId: number, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(userId, {
      nickname: dto.nickname,
      gameId: dto.gameId
    })
    return toUserVO(user)
  }
}
