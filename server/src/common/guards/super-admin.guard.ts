import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { JwtPayload } from '../decorators/current-user.decorator'

/**
 * 超级管理员守卫：仅 adminRole === 'super_admin' 可访问
 * 用于删除、系统设置、修改抽成等高风险操作
 * 用法：@UseGuards(SuperAdminGuard)（叠加在 AdminGuard 之上）
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>()
    const user = request.user
    if (!user || user.role !== 'admin') throw new ForbiddenException('无访问权限')
    if (user.adminRole !== 'super_admin') {
      throw new ForbiddenException('仅超级管理员可执行此操作')
    }
    return true
  }
}
