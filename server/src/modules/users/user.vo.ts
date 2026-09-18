import { User } from './user.entity'

/**
 * 用户对外 VO：默认隐藏 openid 等敏感字段，时间转毫秒时间戳
 * @param withSensitive true 时附加 openid（仅管理后台使用）
 */
export function toUserVO(user: User, withSensitive = false) {
  const base = {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    gameId: user.gameId,
    phone: user.phone,
    role: user.role,
    boosterId: user.boosterId,
    level: user.level,
    vip: user.vip,
    banned: user.banned,
    orderCount: user.orderCount,
    totalSpend: user.totalSpend,
    balance: user.balance,
    createdAt: user.createdAt ? new Date(user.createdAt).getTime() : null,
    // 管理后台「注册时间」列用的字段
    registeredAt: user.createdAt ? new Date(user.createdAt).getTime() : null
  }
  if (withSensitive) {
    return { ...base, openid: user.openid }
  }
  return base
}
