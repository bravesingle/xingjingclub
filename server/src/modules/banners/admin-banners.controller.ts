import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { BannersService } from './banners.service'

@ApiTags('首页 Banner（管理端）')
@Controller('admin/banners')
export class AdminBannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'Banner 列表' })
  list() {
    return this.bannersService.adminList()
  }

  @Post()
  @ApiOperation({ summary: '添加 Banner（可关联已有商品）' })
  create(@Body() dto: any) {
    return this.bannersService.create(dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除 Banner' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.remove(id)
  }
}
