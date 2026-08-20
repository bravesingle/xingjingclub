import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { extname, join } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AdminGuard } from '../../common/guards/admin.guard'

const UPLOAD_DIR = join(process.cwd(), 'uploads')

@ApiTags('管理端 · 文件上传')
@UseGuards(AdminGuard)
@Controller('admin/upload')
export class UploadController {
  @Post('image')
  @ApiOperation({ summary: '上传图片（商品封面等），返回 /uploads/xxx 路径' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } }
    }
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('仅支持图片文件'), false)
        } else {
          cb(null, true)
        }
      }
    })
  )
  uploadImage(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('未收到文件')
    if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })
    const ext = extname(file.originalname || '').toLowerCase() || '.png'
    const filename = 'img-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + ext
    writeFileSync(join(UPLOAD_DIR, filename), file.buffer)
    return { url: '/uploads/' + filename }
  }
}
