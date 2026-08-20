import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Order } from '../orders/order.entity'
import { toOrderVO } from '../orders/order.vo'
import { ORDER_STATUS } from '../orders/orders.constants'
import { UsersService } from '../users/users.service'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PayService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly usersService: UsersService,
    private readonly config: ConfigService
  ) {}

  /**
   * 微信支付预下单
   * - PAY_MOCK=true：返回 { payParams: null, mock: true }，前端走模拟支付
   * - 真实环境：需接入微信支付商户（统一下单 → 签名），此处为接入点
   */
  async createPayment(orderId: number, userId: number) {
    const order = await this.assertOwnPending(orderId, userId)
    const mock = this.config.get('PAY_MOCK') !== 'false'
    if (mock) {
      return { orderId: order.id, amount: order.amount, payParams: null, mock: true }
    }
    // TODO: 真实微信支付统一下单（需商户号 mchid、证书、回调地址）
    // 参考: POST https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi
    // 返回 payParams: { timeStamp, nonceStr, package, signType, paySign }
    throw new BadRequestException('真实微信支付未配置，请设置 PAY_MOCK=true 或完成商户接入')
  }

  /** 模拟支付（开发期）：pending_pay → paid，累计用户消费 */
  async mockPay(orderId: number, userId: number) {
    const order = await this.assertOwnPending(orderId, userId)
    order.status = ORDER_STATUS.paid
    order.paidAt = Date.now()
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
    const saved = await this.orderRepo.save(order)
    await this.usersService.addSpend(userId, order.amount)
    const user = await this.usersService.findByIdOrFail(userId)
    return { paid: true, order: toOrderVO(saved), balance: user.balance }
  }

  /** 查询支付结果 */
  async queryPayResult(orderId: number, userId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException('订单不存在')
    if (order.userId !== userId) throw new ForbiddenException('无权查看该订单')
    return { paid: order.status === ORDER_STATUS.paid || order.status !== ORDER_STATUS.pending_pay }
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
