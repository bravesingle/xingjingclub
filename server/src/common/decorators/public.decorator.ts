import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/** 标记接口为公开（无需登录），与全局 JwtAuthGuard 配合使用 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
