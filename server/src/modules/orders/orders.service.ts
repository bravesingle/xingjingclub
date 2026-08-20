import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'
import { Order } from './order.entity'
import { toOrderVO } from './order.vo'
import { ALLOWED_ACTIONS, genOrderNo, ORDER_STATUS } from './orders.constants'
import { ApplyRefundDto, CreateOrderDto } from './dto/order.dto'
import { ServicesService } from '../services/services.service'
import { UsersService } from '../users/users.service'
import { Booster } from '../boosters/booster.entity'
import { FundService } from '../fund/fund.service'
import { SettingsService } from '../settings/settings.service'
import { ConfigService } from '@nestjs/config'

/** 可申请退款的状态 */
const REFUNDABLE_STATUSES: string[] = [
  ORDER_STATUS.paid,
  ORDER_STATUS.in_progress,
  ORDER_STATUS.completed
]

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Booster)
    private readonly boosterRepo: Repository<Booster>,
    private readonly servicesService: ServicesService,
    private readonly usersService: UsersService,
    private readonly fundService: FundService,
    private readonly settingsService: SettingsService,
    private readonly config: ConfigService
  ) {}

  /* ============ 小程序端 ============ */

  /** 创建订单：校验服务/规格 → 计算金额 → pending_pay */
  async createOrder(userId: number, dto: CreateOrderDto) {
    const service = await this.servicesService.getForUser(dto.serviceId)
    const spec = service.specs.find((s) => s.value === dto.specValue)
    if (!spec) throw new BadRequestException('服务规格无效')

    const quantity = Math.max(1, dto.quantity)
    const payMinutes = Number(this.config.get('PAY_EXPIRE_MINUTES', 15))
    // 下单时快照全局抽成比例（可后台单独修改）
    const settings = await this.settingsService.getMap()
    const platformRate = Number(settings.platformRate || 0)
    const order = this.orderRepo.create({
      orderNo: genOrderNo(),
      userId,
      serviceId: service.id,
      serviceTitle: service.title,
      subtitle: service.subtitle,
      modeName: service.modeName,
      coverGradient: service.coverGradient,
      coverText: service.coverText,
      specLabel: spec.label,
      specValue: spec.value,
      quantity,
      unitPrice: spec.price,
      amount: spec.price * quantity,
      platformRate,
      status: ORDER_STATUS.pending_pay,
      remark: dto.remark || '',
      contact: dto.contact || '',
      payExpireAt: Date.now() + payMinutes * 60 * 1000
    })
    const saved = await this.orderRepo.save(order)
    return toOrderVO(saved)
  }

  /** 我的订单列表 */
  async listMine(userId: number, params: { status?: string; page: number; pageSize: number }) {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .where('o.user_id = :userId', { userId })
      .orderBy('o.id', 'DESC')
    if (params.status && params.status !== 'all') {
      qb.andWhere('o.status = :status', { status: params.status })
    }
    const [list, total] = await qb
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getManyAndCount()
    return { list: list.map(toOrderVO), total }
  }

  /** 订单详情：玩家本人 或 订单打手 可查看 */
  async getMine(userId: number, orderId: number) {
    const order = await this.findOrder(orderId)
    const isPlayer = order.userId === userId
    // 打手查看自己接的订单
    const user = await this.usersService.findById(userId)
    const isBooster = !!(user && user.boosterId && order.boosterId === user.boosterId)
    if (!isPlayer && !isBooster) throw new ForbiddenException('无权查看该订单')
    return toOrderVO(order)
  }

  /** 我的订单统计（个人中心） */
  async getCounts(userId: number) {
    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'cnt')
      .where('o.user_id = :userId', { userId })
      .groupBy('o.status')
      .getRawMany<{ status: string; cnt: string }>()
    const counts: Record<string, number> = {
      pending_pay: 0,
      in_progress: 0,
      completed: 0
    }
    rows.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status] = Number(r.cnt)
    })
    return counts
  }

  /** 取消订单（待支付/已支付 → 已取消） */
  async cancelMine(userId: number, orderId: number) {
    const order = await this.assertMine(userId, orderId)
    this.transition(order, 'cancel')
    return toOrderVO(await this.orderRepo.save(order))
  }

  /** 确认完成（服务中 → 已完成） */
  async completeMine(userId: number, orderId: number) {
    const order = await this.assertMine(userId, orderId)
    this.transition(order, 'complete')
    order.completedAt = Date.now()
    const saved = await this.orderRepo.save(order)
    // 完成订单：用户订单数 +1；打手产生收入（T+N 解冻）
    await this.usersService.incrementOrderCount(userId)
    await this.fundService.onOrderCompleted(saved)
    return toOrderVO(saved)
  }

  /** 申请退款（已支付/服务中/已完成 → 退款中），记录退款前状态供驳回回退 */
  async applyRefundMine(userId: number, orderId: number, dto: ApplyRefundDto) {
    const order = await this.assertMine(userId, orderId)
    if (!REFUNDABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException('当前状态不可申请退款')
    }
    // 先记录原状态（驳回时退回），再置为退款中
    order.refundFrom = order.status
    order.status = ORDER_STATUS.refunding
    order.refundReason = dto.reason + (dto.detail ? '：' + dto.detail : '')
    const saved = await this.orderRepo.save(order)
    return toOrderVO(saved)
  }

  /** 打手接单：待支付完成(paid)的订单 → 打手接单后进入服务中，绑定聊天双方 */
  async acceptByBooster(userId: number, orderId: number) {
    const user = await this.usersService.findByIdOrFail(userId)
    if (user.role !== 'booster' || !user.boosterId) throw new ForbiddenException('仅打手可接单')
    const booster = await this.boosterRepo.findOne({ where: { id: user.boosterId } })
    if (!booster) throw new ForbiddenException('打手档案不存在')
    if (booster.audit !== 'approved') throw new ForbiddenException('打手尚未审核通过')
    if (!booster.deposited) throw new BadRequestException('请先缴纳押金')
    const order = await this.findOrder(orderId)
    if (order.status !== ORDER_STATUS.paid) throw new BadRequestException('当前订单状态不可接单')
    if (order.boosterId) throw new BadRequestException('该订单已被接单')
    order.boosterId = booster.id
    order.serveBy = booster.name
    order.status = ORDER_STATUS.in_progress
    order.startedAt = Date.now()
    return toOrderVO(await this.orderRepo.save(order))
  }

  /** 打手工作台：待接单订单池（已支付且无人接单） */
  async poolList() {
    const list = await this.orderRepo.find({
      where: { status: ORDER_STATUS.paid, boosterId: IsNull() },
      order: { id: 'DESC' }
    })
    return list.map(toOrderVO)
  }

  /** 打手工作台：我的订单（已接单） */
  async listByBoosterForUser(userId: number) {
    const user = await this.usersService.findByIdOrFail(userId)
    if (user.role !== 'booster' || !user.boosterId) throw new ForbiddenException('仅打手可查看')
    const list = await this.orderRepo.find({
      where: { boosterId: user.boosterId },
      order: { id: 'DESC' }
    })
    return list.map(toOrderVO)
  }

  /* ============ 管理端 ============ */

  async adminList(params: { status?: string; keyword?: string; page: number; pageSize: number }) {
    const qb = this.orderRepo.createQueryBuilder('o').orderBy('o.id', 'DESC')
    if (params.status && params.status !== 'all') {
      qb.where('o.status = :status', { status: params.status })
    }
    if (params.keyword) {
      qb.andWhere('(o.order_no LIKE :kw OR o.service_title LIKE :kw)', { kw: `%${params.keyword}%` })
    }
    const [list, total] = await qb
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getManyAndCount()
    // 批量带出玩家昵称
    const ids = [...new Set(list.map((o) => o.userId))]
    const users = await this.usersService.findByIds(ids)
    const nameMap = new Map(users.map((u) => [u.id, u.nickname]))
    return {
      total,
      list: list.map((o) => ({ ...toOrderVO(o), userName: nameMap.get(o.userId) || '' }))
    }
  }

  async adminGet(orderId: number) {
    const order = await this.findOrder(orderId)
    const user = await this.usersService.findById(order.userId)
    return { ...toOrderVO(order), userName: user ? user.nickname : '' }
  }

  /** 管理端：修改单笔订单抽成比例（已完成订单自动重算打手收入） */
  async updateRate(orderId: number, rate: number) {
    const r = Number(rate)
    if (isNaN(r) || r < 0 || r > 100) throw new BadRequestException('抽成比例需在 0-100 之间')
    const order = await this.findOrder(orderId)
    order.platformRate = Math.round(r)
    const saved = await this.orderRepo.save(order)
    await this.fundService.recalcOrderIncome(saved)
    return toOrderVO(saved)
  }

  /** 管理端状态流转：cancel/start/complete/approve_refund/reject_refund */
  async adminAction(orderId: number, action: string) {
    const order = await this.findOrder(orderId)
    if (action === 'start' && order.status === ORDER_STATUS.paid) {
      order.status = ORDER_STATUS.in_progress
      order.startedAt = Date.now()
    } else {
      this.transition(order, action)
    }
    const saved = await this.orderRepo.save(order)

    // 同意退款：扣回用户消费；已完成订单退款同时扣回订单数
    if (action === 'approve_refund') {
      await this.usersService.addSpend(saved.userId, -saved.amount)
      if (saved.refundFrom === ORDER_STATUS.completed) {
        await this.usersService.decrementOrderCount(saved.userId)
      }
    }
    // 完成订单：打手产生收入
    if (action === 'complete') {
      await this.fundService.onOrderCompleted(saved)
    }
    return toOrderVO(saved)
  }

  /* ============ 内部 ============ */

  private async findOrder(orderId: number): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException('订单不存在')
    return order
  }

  private async assertMine(userId: number, orderId: number): Promise<Order> {
    const order = await this.findOrder(orderId)
    if (order.userId !== userId) throw new ForbiddenException('无权操作该订单')
    return order
  }

  /** 通用状态流转校验与执行 */
  private transition(order: Order, action: string): void {
    const allowed = ALLOWED_ACTIONS[order.status] || []
    if (!allowed.includes(action)) {
      throw new BadRequestException(`当前状态（${order.status}）不允许执行该操作`)
    }
    const now = Date.now()
    switch (action) {
      case 'cancel':
        order.status = ORDER_STATUS.cancelled
        order.cancelledAt = now
        break
      case 'start':
        order.status = ORDER_STATUS.in_progress
        order.startedAt = now
        break
      case 'complete':
        order.status = ORDER_STATUS.completed
        order.completedAt = now
        break
      case 'approve_refund':
        order.status = ORDER_STATUS.refunded
        order.refundedAt = now
        break
      case 'reject_refund':
        // 驳回：退回申请退款前的状态
        const from = order.refundFrom || ORDER_STATUS.paid
        order.status = from
        order.refundRejectedAt = now
        break
      default:
        throw new BadRequestException('未知操作')
    }
  }
}
