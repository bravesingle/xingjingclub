import { Body, Controller, Post } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthService } from './auth.service'
import { WechatLoginDto } from './dto/wechat-login.dto'
import { ApplyBoosterDto } from './dto/apply-booster.dto'

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('wechat-login')
  @ApiOperation({ summary: '微信登录（code + 手机号换 token，自动识别玩家/打手）' })
  @ApiOkResponse({ description: '返回 { token, userInfo }，userInfo.role 区分 player/booster' })
  wechatLogin(@Body() dto: WechatLoginDto) {
    return this.authService.wechatLogin(dto)
  }

  @Post('apply-booster')
  @ApiOperation({ summary: '打手入驻申请（需登录，提交后待后台审核）' })
  applyBooster(@CurrentUser('userId') userId: number, @Body() dto: ApplyBoosterDto) {
    return this.authService.applyBooster(userId, dto)
  }
}
