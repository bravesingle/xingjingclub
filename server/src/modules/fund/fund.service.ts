import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, EntityManager, In, Repository } from 'typeorm'
import { randomInt } from 'crypto'
import { Deposit } from './deposit.entity'
import { Income } from './income.entity'
import { Withdrawal } from './withdrawal.entity'
import { ActivationCode } from './activation-code.entity'
import { RechargeRecord } from './recharge-record.entity'
import { PlatformIncome } from './platform-income.entity'
import { Booster } from '../boosters/booster.entity'
import { User } from '../users/user.entity'
import { Order } from '../orders/order.entity'
import { SettingsService } from '../settings/settings.service'
import { WithdrawDto } from './dto/withdraw.dto'

@Injectable()
export class FundService {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
    @InjectRepository(Income)
    private readonly incomeRepo: Repository<Income>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(ActivationCode)
    private readonly codeRepo: Repository<ActivationCode>,
    @InjectRepository(RechargeRecord)
    private readonly rechargeRepo: Repository<RechargeRecord>,
    @InjectRepository(PlatformIncome)
    private readonly platformIncomeRepo: Repository<PlatformIncome>,
    @InjectRepository(Booster)
    private readonly boosterRepo: Repository<Booster>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly settingsService: SettingsService,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  /* ============ 用户余额 ============ */

  /** 充值（开发期 mock 直接入账；真实环境 PAY_MOCK=false 时禁用，需走微信支付） */
  async recharge(userId: number, amount: number) {
    if (process.env.PAY_MOCK === 'false') {
      throw new BadRequestException('正式环境请通过微信支付充值')
    }
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('用户不存在')
    if (!amount || amount <= 0) throw new BadRequestException('充值金额无效')
    // 原子累加，防并发丢更新
    await this.userRepo.increment({ id: userId }, 'balance', amount)
    const rec = this.rechargeRepo.create({ userId, amount, channel: 'mock' })
    await this.rechargeRepo.save(rec)
    const after = await this.userRepo.findOne({ where: { id: userId } })
    return { balance: after ? after.balance : amount, amount }
  }

  /** 兑换激活码（事务 + 悲观锁，防并发重复核销） */
  async redeem(userId: number, code: string) {
    return this.dataSource.transaction(async (em) => {
      const ac = await em.findOne(ActivationCode, {
        where: { code },
        lock: { mode: 'pessimistic_write' }
      })
      if (!ac) throw new BadRequestException('激活码不存在')
      if (ac.status === 'used') throw new BadRequestException('激活码已被使用')
      const user = await em.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' }
      })
      if (!user) throw new NotFoundException('用户不存在')
      user.balance += ac.amount
      ac.status = 'used'
      ac.usedBy = userId
      ac.usedAt = Date.now()
      await em.save(user)
      await em.save(ac)
      const recRepo = em.getRepository(RechargeRecord)
      await recRepo.save(recRepo.create({ userId, amount: ac.amount, channel: 'code', codeId: ac.id }))
      return { balance: user.balance, amount: ac.amount }
    })
  }

  /** 生成激活码（后台） */
  async generateCodes(amount: number, count: number) {
    if (!amount || amount <= 0) throw new BadRequestException('面额无效')
    const n = Math.min(Math.max(Number(count) || 1, 1), 100)
    const codes: ActivationCode[] = []
    for (let i = 0; i < n; i++) {
      const ac = this.codeRepo.create({ code: this.genCode(), amount, status: 'unused' })
      codes.push(await this.codeRepo.save(ac))
    }
    return codes
  }

  /** 激活码列表（后台，带核销用户昵称） */
  async listCodes(status?: string) {
    const qb = this.codeRepo.createQueryBuilder('c').orderBy('c.id', 'DESC')
    if (status && status !== 'all') qb.where('c.status = :status', { status })
    const list = await qb.getMany()
    const userIds = [...new Set(list.filter((c) => c.usedBy).map((c) => c.usedBy as number))]
    const users = userIds.length ? await this.userRepo.find({ where: { id: In(userIds) } }) : []
    const nameMap = new Map(users.map((u) => [u.id, u.nickname]))
    return list.map((c) => ({
      ...c,
      usedByName: nameMap.get(c.usedBy as number) || '',
      usedAt: c.usedAt === null || c.usedAt === undefined ? null : Number(c.usedAt)
    }))
  }

  /** 生成激活码：加密安全随机（crypto.randomInt），不可预测 */
  private genCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let s = ''
    for (let i = 0; i < 12; i++) {
      s += chars[randomInt(0, chars.length)]
    }
    return s
  }

  /* ============ 打手端 ============ */

  /** 缴纳押金（开发期 mock 直接标记；真实环境 PAY_MOCK=false 时禁用，需走微信支付） */
  async payDeposit(userId: number) {
    if (process.env.PAY_MOCK === 'false') {
      throw new BadRequestException('正式环境请通过微信支付缴纳押金')
    }
    const booster = await this.getBoosterByUser(userId)
    if (booster.deposited) throw new BadRequestException('已缴纳押金，无需重复缴纳')
    const settings = await this.settingsService.getMap()
    const amount = Number(settings.depositAmount || 20000)
    const deposit = this.depositRepo.create({ boosterId: booster.id, amount, status: 'paid', paidAt: Date.now() })
    await this.depositRepo.save(deposit)
    booster.deposited = true
    await this.boosterRepo.save(booster)
    return { amount, deposited: true }
  }

  /** 订单完成时产生打手收入（按该单抽成比例，T+N 解冻） */
  async onOrderCompleted(order: Order): Promise<void> {
    if (!order.boosterId) return
    const existed = await this.incomeRepo.findOne({ where: { orderId: order.id } })
    if (existed) return
    const settings = await this.settingsService.getMap()
    const rate = Number(order.platformRate || 0)
    const incomeAmount = Math.round((order.amount * (100 - rate)) / 100)
    const days = Number(settings.settlementDays ?? 3)
    const frozenUntil = (order.completedAt || Date.now()) + days * 24 * 3600 * 1000
    const income = this.incomeRepo.create({
      boosterId: order.boosterId,
      orderId: order.id,
      amount: incomeAmount,
      // 冻结天数为 0 时立即解冻
      status: days === 0 ? 'available' : 'frozen',
      frozenUntil
    })
    await this.incomeRepo.save(income)
    // 平台抽成入账（平台账户）
    const platformAmount = order.amount - incomeAmount
    if (platformAmount > 0) {
      await this.platformIncomeRepo.save(
        this.platformIncomeRepo.create({ orderId: order.id, amount: platformAmount })
      )
    }
  }

  /** 单笔修改抽成后重算打手收入 + 平台抽成（仅冻结中可重算，已解冻/已回滚拒绝） */
  async recalcOrderIncome(order: Order): Promise<void> {
    if (!order.boosterId) return
    const income = await this.incomeRepo.findOne({ where: { orderId: order.id } })
    if (!income) return
    if (income.status !== 'frozen') {
      throw new BadRequestException('该订单收入已解冻或已回滚，不可再修改抽成比例')
    }
    const rate = Number(order.platformRate || 0)
    const newIncome = Math.round((order.amount * (100 - rate)) / 100)
    income.amount = newIncome
    await this.incomeRepo.save(income)
    // 同步平台抽成，保证「打手收入 + 平台抽成 = 订单金额」
    const platformAmount = order.amount - newIncome
    const pi = await this.platformIncomeRepo.findOne({ where: { orderId: order.id } })
    if (platformAmount > 0) {
      if (pi) {
        pi.amount = platformAmount
        await this.platformIncomeRepo.save(pi)
      } else {
        await this.platformIncomeRepo.save(
          this.platformIncomeRepo.create({ orderId: order.id, amount: platformAmount })
        )
      }
    } else if (pi) {
      await this.platformIncomeRepo.delete({ orderId: order.id })
    }
  }

  /**
   * 退款资金结算（事务原子化）：扣回用户消费；已完成订单同时减订单数 + 作废打手收入 + 删除平台抽成。
   * 任一步失败整体回滚，避免「订单已退款但资金未回滚」的部分执行。
   */
  async approveRefundSettlement(order: Order): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      const userRepo = em.getRepository(User)
      // 扣回累计消费（订单金额，分）
      await userRepo.increment({ id: order.userId }, 'totalSpend', -order.amount)

      if (order.refundFrom === 'completed') {
        // 订单数 -1（不小于 0）
        await userRepo
          .createQueryBuilder()
          .update(User)
          .set({ orderCount: () => 'GREATEST(order_count - 1, 0)' })
          .where('id = :id', { id: order.userId })
          .execute()

        // 作废打手收入（悲观锁行，防与提现并发）
        if (order.boosterId) {
          const income = await em.findOne(Income, {
            where: { orderId: order.id },
            lock: { mode: 'pessimistic_write' }
          })
          if (income && income.status !== 'reversed') {
            if (income.status === 'available') {
              const approved = await em.findOne(Withdrawal, {
                where: { boosterId: order.boosterId, status: 'approved' }
              })
              if (approved) {
                throw new BadRequestException('该订单打手收入已进入可提现且存在已打款记录，退款需人工处理')
              }
            }
            income.status = 'reversed'
            await em.save(income)
          }
        }
        // 平台抽成回滚（删除该单记录）
        await em.delete(PlatformIncome, { orderId: order.id })
      }
    })
  }

  /** 钱包：自动解冻到期收入，返回余额/冻结/总收入/已提现 */
  async wallet(userId: number) {
    const booster = await this.getBoosterByUser(userId)
    return this.calcWallet(this.dataSource.manager, booster)
  }

  /** 计算钱包（可传入事务 manager，供提现加锁时复用；reversed 收入不参与统计） */
  private async calcWallet(em: EntityManager, booster: Booster) {
    const now = Date.now()
    const settings = await this.settingsService.getMap()
    const days = Number(settings.settlementDays ?? 3)
    const incomes = await em.find(Income, { where: { boosterId: booster.id } })
    let available = 0
    let frozen = 0
    let total = 0
    for (const inc of incomes) {
      if (inc.status === 'reversed') continue
      total += inc.amount
      // 冻结天数为 0 时，所有冻结收入立即解冻
      const shouldUnfreeze =
        inc.status === 'frozen' &&
        (days === 0 || (inc.frozenUntil !== null && inc.frozenUntil !== undefined && inc.frozenUntil <= now))
      if (shouldUnfreeze) {
        inc.status = 'available'
        await em.save(inc)
      }
      if (inc.status === 'available') available += inc.amount
      else if (inc.status === 'frozen') frozen += inc.amount
    }
    const withdrawals = await em.find(Withdrawal, { where: { boosterId: booster.id } })
    const pendingWithdraw = withdrawals.filter((w) => w.status === 'pending').reduce((s, w) => s + w.amount, 0)
    const withdrawnTotal = withdrawals.filter((w) => w.status === 'approved').reduce((s, w) => s + w.amount, 0)
    const balance = Math.max(0, available - pendingWithdraw - withdrawnTotal)
    return {
      deposited: booster.deposited,
      available,
      frozen,
      total,
      pendingWithdraw,
      withdrawnTotal,
      balance
    }
  }

  /** 提现申请（事务 + 悲观锁锁打手行，防并发超提；余额 = 已解冻 - 待审核 - 已打款） */
  async withdraw(userId: number, dto: WithdrawDto) {
    return this.dataSource.transaction(async (em) => {
      const user = await em.findOne(User, { where: { id: userId } })
      if (!user || user.role !== 'booster' || !user.boosterId) {
        throw new ForbiddenException('仅打手可操作')
      }
      const booster = await em.findOne(Booster, {
        where: { id: user.boosterId },
        lock: { mode: 'pessimistic_write' }
      })
      if (!booster) throw new ForbiddenException('打手档案不存在')
      if (!booster.deposited) throw new BadRequestException('请先缴纳押金')
      const wallet = await this.calcWallet(em, booster)
      if (dto.amount <= 0) throw new BadRequestException('提现金额无效')
      if (dto.amount > wallet.balance) throw new BadRequestException('可提现余额不足')
      const wr = em.getRepository(Withdrawal)
      return wr.save(
        wr.create({
          boosterId: booster.id,
          amount: dto.amount,
          status: 'pending',
          channel: dto.channel || 'wechat',
          account: dto.account || '',
          appliedAt: Date.now()
        })
      )
    })
  }

  /* ============ 管理端 ============ */

  async adminWithdrawals(status?: string) {
    const list = await this.withdrawalRepo.find({ order: { id: 'DESC' } })
    const filtered = status && status !== 'all' ? list.filter((w) => w.status === status) : list
    const boosterIds = [...new Set(filtered.map((w) => w.boosterId))]
    const boosters = await this.boosterRepo.findByIds(boosterIds)
    const nameMap = new Map(boosters.map((b) => [b.id, b.name]))
    return filtered.map((w) => ({
      ...w,
      boosterName: nameMap.get(w.boosterId) || '',
      appliedAt: Number(w.appliedAt) || 0,
      processedAt: w.processedAt === null || w.processedAt === undefined ? null : Number(w.processedAt)
    }))
  }

  async adminApproveWithdrawal(id: number) {
    const w = await this.findWithdrawal(id)
    if (w.status !== 'pending') throw new BadRequestException('仅待审核可打款')
    w.status = 'approved'
    w.processedAt = Date.now()
    return this.withdrawalRepo.save(w)
  }

  async adminRejectWithdrawal(id: number, reason: string) {
    const w = await this.findWithdrawal(id)
    if (w.status !== 'pending') throw new BadRequestException('仅待审核可驳回')
    w.status = 'rejected'
    w.rejectReason = reason || '驳回'
    w.processedAt = Date.now()
    return this.withdrawalRepo.save(w)
  }

  async adminDeposits() {
    const all = await this.depositRepo.find({ order: { id: 'DESC' } })
    const boosterIds = [...new Set(all.map((d) => d.boosterId))]
    const boosters = boosterIds.length ? await this.boosterRepo.find({ where: { id: In(boosterIds) } }) : []
    const validIds = new Set(boosters.map((b) => b.id))
    // 过滤孤儿押金记录（打手已删除）
    const list = all.filter((d) => validIds.has(d.boosterId))
    const nameMap = new Map(boosters.map((b) => [b.id, b.name]))
    return list.map((d) => ({
      ...d,
      boosterName: nameMap.get(d.boosterId) || '',
      paidAt: Number(d.paidAt) || 0
    }))
  }

  /** 平台抽成账户统计 */
  async platformStats() {
    const list = await this.platformIncomeRepo.find({ order: { id: 'DESC' } })
    const total = list.reduce((s, x) => s + x.amount, 0)
    return { total, orderCount: list.length, list }
  }

  /* ============ 内部 ============ */

  private async getBoosterByUser(userId: number): Promise<Booster> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user || user.role !== 'booster' || !user.boosterId) {
      throw new ForbiddenException('仅打手可操作')
    }
    const booster = await this.boosterRepo.findOne({ where: { id: user.boosterId } })
    if (!booster) throw new ForbiddenException('打手档案不存在')
    return booster
  }

  private async findWithdrawal(id: number): Promise<Withdrawal> {
    const w = await this.withdrawalRepo.findOne({ where: { id } })
    if (!w) throw new NotFoundException('提现记录不存在')
    return w
  }
}
