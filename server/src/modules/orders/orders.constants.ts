/** 订单状态机（与小程序端一致） */
export const ORDER_STATUS = {
  pending_pay: 'pending_pay',
  paid: 'paid',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
  refunding: 'refunding',
  refunded: 'refunded'
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

/** 各状态允许的流转 action */
export const ALLOWED_ACTIONS: Record<string, string[]> = {
  pending_pay: ['cancel'],
  paid: ['cancel', 'start'],
  in_progress: ['complete'],
  completed: [],
  cancelled: [],
  refunding: ['approve_refund', 'reject_refund'],
  refunded: []
}

export const ACTION_LABEL: Record<string, string> = {
  cancel: '取消订单',
  start: '开始服务',
  complete: '标记完成',
  approve_refund: '同意退款',
  reject_refund: '驳回退款'
}

/** 生成订单号：XJ + 时间戳 + 4 位加密安全随机 */
import { randomInt } from 'crypto'

export function genOrderNo(): string {
  const d = new Date()
  const p = (n: number) => (n < 10 ? '0' + n : '' + n)
  const stamp =
    d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds())
  return 'XJ' + stamp + randomInt(1000, 10000)
}
