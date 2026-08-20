import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AdminGuard } from '../../common/guards/admin.guard'
import { SuperAdminGuard } from '../../common/guards/super-admin.guard'
import { SettingsService } from '../settings/settings.service'

@ApiTags('管理端 · 系统设置')
@UseGuards(AdminGuard)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: '读取设置' })
  get() {
    return this.settingsService.getMap()
  }

  @Put()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '更新设置（仅超级管理员）' })
  update(@Body() patch: Record<string, any>) {
    return this.settingsService.update(patch)
  }

  @Post('reset')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '重置设置为默认值（仅超级管理员）' })
  reset() {
    return this.settingsService.reset()
  }
}
