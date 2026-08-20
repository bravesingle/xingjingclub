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
import { BoostersService } from '../boosters/boosters.service'
import { CreateBoosterDto, UpdateBoosterDto } from '../boosters/dto/booster.dto'
import { AdminQueryDto, BatchDeleteDto } from './dto/admin.dto'

@ApiTags('管理端 · 打手')
@UseGuards(AdminGuard)
@Controller('admin/boosters')
export class AdminBoostersController {
  constructor(private readonly boostersService: BoostersService) {}

  @Get()
  @ApiOperation({ summary: '打手列表（审核状态/关键词）' })
  list(@Query() query: AdminQueryDto) {
    return this.boostersService.adminList({
      status: query.status,
      keyword: query.keyword,
      page: query.page,
      pageSize: query.pageSize
    })
  }

  @Post()
  @ApiOperation({ summary: '新增打手（默认待审核）' })
  create(@Body() dto: CreateBoosterDto) {
    return this.boostersService.create(dto)
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新打手：审核(audit)/上线(online)/接单(accepting)/段位/评分/备注' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBoosterDto) {
    return this.boostersService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '删除打手（仅超级管理员）' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.boostersService.remove(id)
  }

  @Post('batch-delete')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '批量删除打手（仅超级管理员）' })
  batchRemove(@Body() dto: BatchDeleteDto) {
    return this.boostersService.batchRemove(dto.ids)
  }
}
