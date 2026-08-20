import { User } from './user.entity'

/**
 * 用户对外 VO：隐藏 openid 等敏感字段，时间转毫秒时间戳
 */
export function toUserVO(user: User) {
  return {
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
    createdAt: user.createdAt ? new Date(user.createdAt).getTime() : null
  }
}
