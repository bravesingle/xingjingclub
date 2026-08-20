import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AdminGuard } from '../../common/guards/admin.guard'
import { SuperAdminGuard } from '../../common/guards/super-admin.guard'
import { UsersService } from '../users/users.service'
import { AdminQueryDto, BatchDeleteDto } from './dto/admin.dto'

@ApiTags('管理端 · 用户')
@UseGuards(AdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '用户列表（昵称/游戏ID 搜索）' })
  list(@Query() query: AdminQueryDto) {
    return this.usersService.adminList({
      keyword: query.keyword,
      page: query.page,
      pageSize: query.pageSize
    })
  }

  @Patch(':id/ban')
  @ApiOperation({ summary: '封禁/解封切换' })
  toggleBan(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleBan(id)
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '删除用户（仅超级管理员）' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id)
  }

  @Post('batch-delete')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '批量删除用户（仅超级管理员）' })
  batchRemove(@Body() dto: BatchDeleteDto) {
    return this.usersService.batchRemove(dto.ids)
  }

  @Post()
  @ApiOperation({ summary: '新增用户' })
  create(@Body() dto: { nickname: string; gameId?: string }) {
    return this.usersService.createByAdmin(dto)
  }
}
