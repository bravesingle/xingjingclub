import { Order } from './order.entity'

/** 订单对外 VO：时间统一毫秒时间戳 */
export function toOrderVO(order: Order) {
  return {
    id: order.id,
    orderNo: order.orderNo,
    serviceId: order.serviceId,
    serviceTitle: order.serviceTitle,
    subtitle: order.subtitle,
    modeName: order.modeName,
    coverGradient: order.coverGradient,
    coverText: order.coverText,
    specLabel: order.specLabel,
    specValue: order.specValue,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    amount: order.amount,
    status: order.status,
    remark: order.remark || '',
    contact: order.contact,
    serveBy: order.serveBy,
    boosterId: order.boosterId,
    platformRate: order.platformRate || 0,
    // 分账明细：平台抽成 + 打手收入（分）
    platformIncome: Math.round((order.amount * (order.platformRate || 0)) / 100),
    boosterIncome: order.amount - Math.round((order.amount * (order.platformRate || 0)) / 100),
    payExpireAt: order.payExpireAt,
    paidAt: order.paidAt,
    startedAt: order.startedAt,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
    refundReason: order.refundReason,
    refundFrom: order.refundFrom,
    refundedAt: order.refundedAt,
    refundRejectedAt: order.refundRejectedAt,
    createdAt: order.createdAt ? new Date(order.createdAt).getTime() : null
  }
}
