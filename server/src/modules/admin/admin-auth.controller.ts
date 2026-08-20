import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AdminService } from './admin.service'
import { AdminLoginDto } from './dto/admin-login.dto'

@ApiTags('管理端 · 认证')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: '管理员登录' })
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto)
  }

  @Get('profile')
  @ApiOperation({ summary: '当前管理员信息' })
  profile(@CurrentUser('userId') adminId: number) {
    return this.adminService.profile(adminId)
  }
}
