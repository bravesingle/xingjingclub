import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { JwtPayload } from '../decorators/current-user.decorator'

/**
 * 管理端守卫：要求当前登录用户 role === 'admin'
 * 用法：@UseGuards(AdminGuard)
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>()
    const user = request.user
    if (!user) throw new ForbiddenException('无访问权限')
    if (user.role !== 'admin') throw new ForbiddenException('仅管理员可访问')
    return true
  }
}
