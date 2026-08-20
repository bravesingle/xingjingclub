import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface ApiResponse<T> {
  code: number
  data: T | null
  msg: string
}

/**
 * 全局响应拦截器：所有成功响应统一为 { code: 0, data, msg: 'ok' }
 * 与小程序 utils/request.js 的契约对齐（code 0 为成功）
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        data: data === undefined || data === null ? null : data,
        msg: 'ok'
      }))
    )
  }
}
