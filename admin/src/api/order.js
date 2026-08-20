// admin/src/api/order.js
// 订单管理 + 数据统计（对接后端 /admin/orders、/admin/stats/dashboard）
import { get, post } from './base'

export const ORDER_STATUS_MAP = {
  pending_pay: { text: '待支付', type: 'warning' },
  paid: { text: '已支付', type: 'primary' },
  in_progress: { text: '服务中', type: 'primary' },
  completed: { text: '已完成', type: 'success' },
  cancelled: { text: '已取消', type: 'info' },
  refunding: { text: '退款中', type: 'warning' },
  refunded: { text: '已退款', type: 'info' }
}

/** 订单列表：{ status, keyword } → 数组 */
export function listOrders(params = {}) {
  return get('/admin/orders', {
    page: 1,
    pageSize: 200,
    status: params.status && params.status !== 'all' ? params.status : '',
    keyword: params.keyword || ''
  }).then((r) => r.list)
}

export function getOrder(id) {
  return get('/admin/orders/' + id)
}

/**
 * 状态流转：cancel/start/complete/approve_refund/reject_refund
 */
export function updateOrderStatus(id, action) {
  return post('/admin/orders/' + id + '/action', { action })
}

export function updateOrderRate(id, platformRate) {
  return post('/admin/orders/' + id + '/rate', { platformRate })
}

/** 统计看板（后端返回字段适配成页面期望结构） */
export function orderStats() {
  return get('/admin/stats/dashboard').then((r) => ({
    totalOrders: r.totalOrders,
    totalAmount: r.totalAmount,
    todayOrders: r.todayOrders,
    todayAmount: r.todayAmount,
    pendingPay: r.pendingPay,
    inProgress: r.inProgress,
    refunding: r.refunding,
    totalUsers: r.totalUsers,
    bannedUsers: r.bannedUsers,
    onlineBoosters: r.booster ? r.booster.online : 0,
    acceptingBoosters: r.booster ? r.booster.accepting : 0,
    // 打手概览（Dashboard 打手卡用）
    boosterTotal: r.booster ? r.booster.total : 0,
    boosterPending: r.booster ? r.booster.pending : 0,
    boosterOnline: r.booster ? r.booster.online : 0,
    boosterAccepting: r.booster ? r.booster.accepting : 0,
    boosterOrders: r.booster ? r.booster.totalOrders : 0,
    statusDist: r.statusDist,
    trend: r.trend
  }))
}
