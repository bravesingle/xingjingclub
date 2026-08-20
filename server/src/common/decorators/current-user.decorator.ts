import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

export interface JwtPayload {
  userId: number
  role: 'user' | 'admin'
  openid?: string
  /** 管理员角色：super_admin 超级管理员 / admin 普通管理员 */
  adminRole?: string
}

/**
 * 获取当前登录用户：@CurrentUser() user 或 @CurrentUser('userId') id
 * 由 JwtAuthGuard 在 request.user 上写入
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>()
    const user = request.user
    return data ? user?.[data] : user
  }
)
