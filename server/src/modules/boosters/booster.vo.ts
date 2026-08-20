import { Booster } from './booster.entity'

/** 打手对外 VO */
export function toBoosterVO(booster: Booster) {
  return {
    id: booster.id,
    name: booster.name,
    avatar: booster.avatar,
    phone: booster.phone,
    userId: booster.userId,
    categories: booster.categories || [],
    categoryNames: booster.categoryNames || [],
    mode: booster.mode,
    rank: booster.rank,
    rating: booster.rating,
    orderCount: booster.orderCount,
    online: booster.online,
    accepting: booster.accepting,
    audit: booster.audit,
    deposited: booster.deposited,
    withdrawChannel: booster.withdrawChannel,
    withdrawAccount: booster.withdrawAccount,
    joinedAt: booster.joinedAt,
    remark: booster.remark,
    createdAt: booster.createdAt ? new Date(booster.createdAt).getTime() : null
  }
}
