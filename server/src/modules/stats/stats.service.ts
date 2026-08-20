import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Order } from '../orders/order.entity'
import { User } from '../users/user.entity'
import { RedisService } from '../../redis/redis.service'

const STATS_CACHE_KEY = 'cache:stats:dashboard'
const STATS_CACHE_TTL = 30

const STATUS_TEXT: Record<string, string> = {
  pending_pay: '待支付',
  paid: '已支付',
  in_progress: '服务中',
  completed: '已完成',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款'
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redis: RedisService
  ) {}

  /** 管理端统计看板（Redis 缓存 30s） */
  async dashboard() {
    const cached = await this.redis.get(STATS_CACHE_KEY)
    if (cached) return cached

    const [orders, totalUsers, bannedUsers] = await Promise.all([
      this.orderRepo.find(),
      this.userRepo.count(),
      this.userRepo.count({ where: { banned: true } })
    ])

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayTs = todayStart.getTime()

    // 营业额口径：剔除未支付/已取消/已退款（已退款订单保留在列表中，但金额不计入销售额）
    const REVENUE_EXCLUDED = ['pending_pay', 'cancelled', 'refunded']
    const paidOrders = orders.filter((o) => !REVENUE_EXCLUDED.includes(o.status))
    const todayOrders = orders.filter((o) => new Date(o.createdAt).getTime() >= todayTs)
    const todayPaid = orders.filter(
      (o) => o.paidAt && o.paidAt >= todayTs && o.status !== 'refunded'
    )

    const statusDist: Record<string, number> = {}
    Object.keys(STATUS_TEXT).forEach((k) => {
      statusDist[k] = orders.filter((o) => o.status === k).length
    })

    // 最近 14 天按支付时间聚合（已退款订单不计入销售额与订单量）
    const days = 14
    const trend: { date: string; count: number; amount: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const start = d.getTime()
      const end = start + 24 * 3600 * 1000
      const dayOrders = orders.filter(
        (o) => o.paidAt && o.paidAt >= start && o.paidAt < end && o.status !== 'refunded'
      )
      trend.push({
        date: d.getMonth() + 1 + '/' + d.getDate(),
        count: dayOrders.length,
        amount: dayOrders.reduce((sum, o) => sum + o.amount, 0)
      })
    }

    const data = {
      totalOrders: orders.length,
      totalAmount: paidOrders.reduce((sum, o) => sum + o.amount, 0),
      todayOrders: todayOrders.length,
      todayAmount: todayPaid.reduce((sum, o) => sum + o.amount, 0),
      pendingPay: statusDist.pending_pay || 0,
      inProgress: statusDist.in_progress || 0,
      refunding: statusDist.refunding || 0,
      totalUsers,
      bannedUsers,
      statusDist,
      trend
    }
    await this.redis.set(STATS_CACHE_KEY, data, STATS_CACHE_TTL)
    return data
  }
}
