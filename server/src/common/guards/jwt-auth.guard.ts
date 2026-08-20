import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { JwtPayload } from '../decorators/current-user.decorator'
import { User } from '../../modules/users/user.entity'

/**
 * 全局 JWT 认证守卫（在 app.module 以 APP_GUARD 注册）
 * - 标记 @Public() 的接口放行
 * - 其余接口校验 Authorization: Bearer <token>
 * - 用户角色：每次请求查库校验用户存在且未被封禁（封禁即刻生效，无需重新登录）
 * - 管理员角色：跳过用户封禁检查
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest()
    const auth: string = request.headers['authorization'] || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) throw new UnauthorizedException('未登录')

    let payload: JwtPayload
    try {
      payload = this.jwtService.verify<JwtPayload>(token)
    } catch (e) {
      throw new UnauthorizedException('登录已过期，请重新登录')
    }

    // 用户角色：校验账号存在且未被封禁（封禁立即生效）
    if (payload.role === 'user') {
      const user = await this.userRepo.findOne({ where: { id: payload.userId } })
      if (!user) throw new UnauthorizedException('用户不存在，请重新登录')
      if (user.banned) throw new UnauthorizedException('账号已被封禁')
    }

    request.user = payload
    return true
  }
}
