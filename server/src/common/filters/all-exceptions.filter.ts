import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { Request, Response } from 'express'

/**
 * 全局异常过滤器：错误统一为 { code, data: null, msg }
 * - HttpException（含业务抛出的 BadRequest/Unauthorized 等）：code 与 HTTP 状态一致
 * - 未知异常：500
 * 前端契约：code 0 成功；401 登录失效（前端自动跳登录页）
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception')

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let msg = '服务器内部错误'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      if (typeof res === 'string') {
        msg = res
      } else if (res && typeof res === 'object') {
        const m = (res as any).message
        msg = Array.isArray(m) ? m[0] : m || exception.message
      } else {
        msg = exception.message
      }
    } else {
      this.logger.error(`[${request.method}] ${request.url}`, exception as any)
    }

    response.status(status).json({
      code: status,
      data: null,
      msg
    })
  }
}
