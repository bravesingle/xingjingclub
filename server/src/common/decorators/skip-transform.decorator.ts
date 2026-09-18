import { SetMetadata } from '@nestjs/common'

export const SKIP_TRANSFORM_KEY = 'skipTransform'

/**
 * 标记接口跳过全局响应包装（TransformInterceptor）
 * 用于需要返回「原始报文结构」的接口，例如微信支付回调必须返回 {"code":"SUCCESS"}
 */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true)
