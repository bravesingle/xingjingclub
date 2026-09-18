import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomBytes } from 'crypto'
import { Order } from '../orders/order.entity'
import { toOrderVO } from '../orders/order.vo'
import { ORDER_STATUS } from '../orders/orders.constants'
import { UsersService } from '../users/users.service'
import { ConfigService } from '@nestjs/config'
import { WechatPayClient, NotifyResult } from './wechat-pay.client'
import { Booster } from '../boosters/booster.entity'
import { Deposit } from '../fund/deposit.entity'
import { SettingsService } from '../settings/settings.service'

/** 微信支付 attach 前缀：保证金（格式 deposit:{boosterId}） */
const ATTACH_DEPOSIT = 'deposit:'

@Injectable()
export class PayService {
  private readonly logger = new Logger('Pay')
  private wxClient: WechatPayClient | null = null

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Booster)
    private readonly boosterRepo: Repository<Booster>,
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
    private readonly usersService: UsersService,
    private readonly settingsService: SettingsService,
    private readonly config: ConfigService
  ) {}

  /**
   * 微信支付预下单
   * - PAY_MOCK=true：返回 { payParams: null, mock: true }，前端走模拟支付
   * - PAY_MOCK=false：调用微信支付 JSAPI 真实下单，返回小程序 wx.requestPayment 所需参数
   */
  async createPayment(orderId: number, userId: number) {
    const order = await this.assertOwnPending(orderId, userId)
    const mock = this.config.get('PAY_MOCK') !== 'false'
    if (mock) {
      return { orderId: order.id, amount: order.amount, payParams: null, mock: true }
    }
    // 真实微信支付：JSAPI 下单（openid 必须来自真实微信登录 jscode2session，非 mock）
    const user = await this.assertRealUser(userId)
    const appid = this.config.get('WECHAT_APPID') || ''
    const wx = this.getWxClient()
    const prepayId = await wx.jsapiPrepay({
      appid,
      description: order.serviceTitle || '星竞电竞服务',
      outTradeNo: order.orderNo,
      amountFen: order.amount,
      openid: user.openid
    })
    const payParams = wx.buildMiniPayParams(appid, prepayId)
    return { orderId: order.id, amount: order.amount, payParams, mock: false }
  }

  /**
   * 保证金支付预下单（陪玩师缴纳保证金，PAY_MOCK=false 时真实下单）
   */
  async createDepositPayment(userId: number) {
    const booster = await this.boosterRepo.findOne({ where: { userId } })
    if (!booster) throw new BadRequestException('未找到陪玩师档案')
    if (booster.deposited) throw new BadRequestException('已缴纳保证金，无需重复缴纳')
    const settings = await this.settingsService.getMap()
    const amount = Number(settings.depositAmount || 20000)
    const mock = this.config.get('PAY_MOCK') !== 'false'
    const outTradeNo = 'DP' + Date.now() + randomBytes(3).toString('hex').toUpperCase()
    if (mock) {
      // 开发期：直接标记已缴纳（与 /booster/deposit/pay 行为一致）
      await this.markDepositPaid(booster, amount)
      return { amount, payParams: null, mock: true, deposited: true }
    }
    const user = await this.assertRealUser(userId)
    const appid = this.config.get('WECHAT_APPID') || ''
    const wx = this.getWxClient()
    const prepayId = await wx.jsapiPrepay({
      appid,
      description: '陪玩师保证金',
      outTradeNo,
      amountFen: amount,
      openid: user.openid,
      attach: ATTACH_DEPOSIT + booster.id
    })
    const payParams = wx.buildMiniPayParams(appid, prepayId)
    return { amount, outTradeNo, payParams, mock: false }
  }

  /** 校验用户为真实微信登录（openid 非 mock） */
  private async assertRealUser(userId: number) {
    const user = await this.usersService.findByIdOrFail(userId)
    if (!user.openid || user.openid.startsWith('mock_')) {
      throw new BadRequestException('当前为模拟登录（openid 非真实），请先完成微信登录')
    }
    return user
  }

  /** 标记保证金已缴纳（幂等） */
  private async markDepositPaid(booster: Booster, amount: number): Promise<void> {
    await this.depositRepo.save(
      this.depositRepo.create({ boosterId: booster.id, amount, status: 'paid', paidAt: Date.now() })
    )
    booster.deposited = true
    await this.boosterRepo.save(booster)
  }

  /**
   * 微信支付结果回调（幂等处理）
   * 验签解密由 controller 完成，这里只做业务：trade_state=SUCCESS → 订单置 paid、累计消费
   */
  async handleNotify(notify: NotifyResult): Promise<{ handled: boolean; msg?: string }> {
    if (notify.trade_state !== 'SUCCESS') {
      // 非成功态（如 CLOSED/REVOKED/PAYERROR）：无需改单，应答成功避免微信无限重试
      return { handled: true, msg: '非成功支付通知，忽略' }
    }
    // 保证金支付回调（attach = deposit:{boosterId}）
    if ((notify.attach || '').startsWith(ATTACH_DEPOSIT)) {
      return this.handleDepositNotify(notify)
    }
    const order = await this.orderRepo.findOne({ where: { orderNo: notify.out_trade_no } })
    if (!order) {
      this.logger.warn(`微信回调订单不存在: ${notify.out_trade_no}`)
      // 订单不存在仍应答成功（微信文档：重复/未知通知直接 SUCCESS），避免重试风暴
      return { handled: true, msg: '订单不存在，忽略' }
    }
    // 金额一致性校验（分）
    if (notify.amount && notify.amount.total !== order.amount) {
      this.logger.error(
        `微信回调金额不符 order=${order.orderNo} expect=${order.amount} got=${notify.amount.total}`
      )
      // 金额不符为异常，返回失败让微信重试并人工介入
      return { handled: false, msg: '金额不一致' }
    }
    // 幂等：已是 paid 及之后状态（in_progress/completed/refunding/refunded）不再重复入账
    if (order.status !== ORDER_STATUS.pending_pay) {
      return { handled: true, msg: '订单非待支付态，忽略' }
    }
    order.status = ORDER_STATUS.paid
    order.paidAt = Date.now()
    // 记录支付渠道与微信交易号（退款时用于真实微信退款）
    order.payChannel = 'wechat'
    order.wxTransactionId = notify.transaction_id || ''
    await this.orderRepo.save(order)
    await this.usersService.addSpend(order.userId, order.amount)
    this.logger.log(`✅ 微信支付成功: order=${order.orderNo} amount=${order.amount} tx=${notify.transaction_id}`)
    return { handled: true }
  }

  /**
   * 保证金支付回调处理（幂等）
   * attach 格式 deposit:{boosterId}；金额与后台配置的保证金一致才入账
   */
  private async handleDepositNotify(notify: NotifyResult): Promise<{ handled: boolean; msg?: string }> {
    const boosterId = Number((notify.attach || '').split(':')[1])
    if (!boosterId || isNaN(boosterId)) {
      this.logger.warn(`保证金回调缺少陪玩师标识: attach=${notify.attach}`)
      return { handled: true, msg: '合法标识缺失，忽略' }
    }
    const booster = await this.boosterRepo.findOne({ where: { id: boosterId } })
    if (!booster) {
      this.logger.warn(`保证金回调陪玩师不存在: ${boosterId}`)
      return { handled: true, msg: '陪玩师不存在，忽略' }
    }
    // 幂等：已缴纳直接成功应答
    if (booster.deposited) {
      return { handled: true, msg: '保证金已缴纳，忽略重复回调' }
    }
    const settings = await this.settingsService.getMap()
    const expect = Number(settings.depositAmount || 20000)
    const paid = notify.amount?.total ?? -1
    if (paid !== expect) {
      this.logger.error(`保证金回调金额不符 booster=${boosterId} expect=${expect} got=${paid}`)
      return { handled: false, msg: '保证金金额不一致' }
    }
    await this.markDepositPaid(booster, paid)
    this.logger.log(`✅ 保证金支付成功: booster=${boosterId} amount=${paid} tx=${notify.transaction_id}`)
    return { handled: true }
  }

  private getWxClient(): WechatPayClient {    if (!this.wxClient) {
      try {
        this.wxClient = new WechatPayClient(process.env)
      } catch (e) {
        const msg = e instanceof Error ? e.message : '微信支付客户端初始化失败'
        throw new BadRequestException(msg)
      }
    }
    return this.wxClient
  }

  /** 模拟支付（开发期）：pending_pay → paid，累计用户消费 */
  async mockPay(orderId: number, userId: number) {
    const order = await this.assertOwnPending(orderId, userId)
    order.status = ORDER_STATUS.paid
    order.paidAt = Date.now()
    order.payChannel = 'mock'
    const saved = await this.orderRepo.save(order)
    await this.usersService.addSpend(userId, order.amount)
    return { paid: true, order: toOrderVO(saved) }
  }

  /** 余额支付：扣余额 → pending_pay → paid */
  async payByBalance(orderId: number, userId: number) {
    const order = await this.assertOwnPending(orderId, userId)
    const ok = await this.usersService.deductBalance(userId, order.amount)
    if (!ok) throw new BadRequestException('余额不足，请先充值')
    order.status = ORDER_STATUS.paid
    order.paidAt = Date.now()
    order.payChannel = 'balance'
    const saved = await this.orderRepo.save(order)
    await this.usersService.addSpend(userId, order.amount)
    const user = await this.usersService.findByIdOrFail(userId)
    return { paid: true, order: toOrderVO(saved), balance: user.balance }
  }

  /** 查询支付结果：cancelled/refunded 等终态不再返回 paid=true */
  async queryPayResult(orderId: number, userId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException('订单不存在')
    if (order.userId !== userId) throw new ForbiddenException('无权查看该订单')
    const PAID_STATUSES: string[] = [
      ORDER_STATUS.paid,
      ORDER_STATUS.in_progress,
      ORDER_STATUS.completed,
      ORDER_STATUS.refunding,
      ORDER_STATUS.refunded
    ]
    return { paid: PAID_STATUSES.includes(order.status), status: order.status }
  }

  private async assertOwnPending(orderId: number, userId: number): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException('订单不存在')
    if (order.userId !== userId) throw new ForbiddenException('无权操作该订单')
    if (order.status !== ORDER_STATUS.pending_pay) {
      throw new BadRequestException('订单状态异常，无法支付')
    }
    // 超时未支付不允许支付
    if (order.payExpireAt && Date.now() > order.payExpireAt) {
      throw new BadRequestException('订单已超时，请重新下单')
    }
    return order
  }
}
