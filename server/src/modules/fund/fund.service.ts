import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
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
    private readonly settingsService: SettingsService
  ) {}

  /* ============ 用户余额 ============ */

  /** 充值（开发期 mock，直接入账） */
  async recharge(userId: number, amount: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('用户不存在')
    if (!amount || amount <= 0) throw new BadRequestException('充值金额无效')
    user.balance += amount
    await this.userRepo.save(user)
    const rec = this.rechargeRepo.create({ userId, amount, channel: 'mock' })
    await this.rechargeRepo.save(rec)
    return { balance: user.balance, amount }
  }

  /** 兑换激活码 */
  async redeem(userId: number, code: string) {
    const ac = await this.codeRepo.findOne({ where: { code } })
    if (!ac) throw new BadRequestException('激活码不存在')
    if (ac.status === 'used') throw new BadRequestException('激活码已被使用')
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('用户不存在')
    user.balance += ac.amount
    await this.userRepo.save(user)
    ac.status = 'used'
    ac.usedBy = userId
    ac.usedAt = Date.now()
    await this.codeRepo.save(ac)
    const rec = this.rechargeRepo.create({ userId, amount: ac.amount, channel: 'code', codeId: ac.id })
    await this.rechargeRepo.save(rec)
    return { balance: user.balance, amount: ac.amount }
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
    return list.map((c) => ({ ...c, usedByName: nameMap.get(c.usedBy as number) || '' }))
  }

  private genCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let s = ''
    for (let i = 0; i < 12; i++) {
      s += chars[Math.floor(Math.random() * chars.length)]
    }
    return s
  }

  /* ============ 打手端 ============ */

  /** 缴纳押金（开发期直接标记已缴纳，真实接微信支付） */
  async payDeposit(userId: number) {
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

  /** 单笔修改抽成后重算打手收入（仅已完成且已产生收入的订单） */
  async recalcOrderIncome(order: Order): Promise<void> {
    if (!order.boosterId) return
    const income = await this.incomeRepo.findOne({ where: { orderId: order.id } })
    if (!income) return
    const rate = Number(order.platformRate || 0)
    income.amount = Math.round((order.amount * (100 - rate)) / 100)
    await this.incomeRepo.save(income)
  }

  /** 钱包：自动解冻到期收入，返回余额/冻结/总收入/已提现 */
  async wallet(userId: number) {
    const booster = await this.getBoosterByUser(userId)
    const now = Date.now()
    const settings = await this.settingsService.getMap()
    const days = Number(settings.settlementDays ?? 3)
    const incomes = await this.incomeRepo.find({ where: { boosterId: booster.id } })
    let available = 0
    let frozen = 0
    let total = 0
    for (const inc of incomes) {
      total += inc.amount
      // 冻结天数为 0 时，所有冻结收入立即解冻
      const shouldUnfreeze =
        inc.status === 'frozen' &&
        (days === 0 || (inc.frozenUntil !== null && inc.frozenUntil !== undefined && inc.frozenUntil <= now))
      if (shouldUnfreeze) {
        inc.status = 'available'
        await this.incomeRepo.save(inc)
      }
      if (inc.status === 'available') available += inc.amount
      else if (inc.status === 'frozen') frozen += inc.amount
    }
    const withdrawals = await this.withdrawalRepo.find({ where: { boosterId: booster.id } })
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

  /** 提现申请（可提现余额 = 已解冻收入 - 待审核 - 已打款） */
  async withdraw(userId: number, dto: WithdrawDto) {
    const booster = await this.getBoosterByUser(userId)
    if (!booster.deposited) throw new BadRequestException('请先缴纳押金')
    const wallet = await this.wallet(userId)
    if (dto.amount <= 0) throw new BadRequestException('提现金额无效')
    if (dto.amount > wallet.balance) throw new BadRequestException('可提现余额不足')
    const withdrawal = this.withdrawalRepo.create({
      boosterId: booster.id,
      amount: dto.amount,
      status: 'pending',
      channel: dto.channel || 'wechat',
      account: dto.account || '',
      appliedAt: Date.now()
    })
    return this.withdrawalRepo.save(withdrawal)
  }

  /* ============ 管理端 ============ */

  async adminWithdrawals(status?: string) {
    const list = await this.withdrawalRepo.find({ order: { id: 'DESC' } })
    const filtered = status && status !== 'all' ? list.filter((w) => w.status === status) : list
    const boosterIds = [...new Set(filtered.map((w) => w.boosterId))]
    const boosters = await this.boosterRepo.findByIds(boosterIds)
    const nameMap = new Map(boosters.map((b) => [b.id, b.name]))
    return filtered.map((w) => ({ ...w, boosterName: nameMap.get(w.boosterId) || '' }))
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
    return list.map((d) => ({ ...d, boosterName: nameMap.get(d.boosterId) || '' }))
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
