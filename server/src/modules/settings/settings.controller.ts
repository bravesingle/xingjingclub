import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { SettingsService } from './settings.service'

@ApiTags('系统设置（公开）')
@Public()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  @ApiOperation({ summary: '小程序端公开配置：公告/客服微信/下单开关' })
  getPublic() {
    return this.settingsService.getPublic()
  }
}
