import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Reflector } from '@nestjs/core'
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator'

export interface ApiResponse<T> {
  code: number
  data: T | null
  msg: string
}

/**
 * 全局响应拦截器：所有成功响应统一为 { code: 0, data, msg: 'ok' }
 * 与小程序 utils/request.js 的契约对齐（code 0 为成功）
 * - 标了 @SkipTransform() 的路由（如微信支付回调）原样返回，不包装
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (skip) return next.handle() as Observable<T>
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        data: data === undefined || data === null ? null : data,
        msg: 'ok'
      }))
    )
  }
}
