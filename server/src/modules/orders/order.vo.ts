import { Order } from './order.entity'

/** bigint 时间戳统一转 number（TypeORM bigint 列会返回字符串，前端 new Date 会 Invalid） */
function ts(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

/** 订单对外 VO：时间统一毫秒时间戳（number） */
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
    payExpireAt: ts(order.payExpireAt),
    paidAt: ts(order.paidAt),
    startedAt: ts(order.startedAt),
    completedAt: ts(order.completedAt),
    cancelledAt: ts(order.cancelledAt),
    refundReason: order.refundReason,
    refundFrom: order.refundFrom,
    refundedAt: ts(order.refundedAt),
    refundRejectedAt: ts(order.refundRejectedAt),
    createdAt: order.createdAt ? new Date(order.createdAt).getTime() : null
  }
}
