// mock/order.js
// 订单 Mock：内存态数据（存于 app.globalData.mockOrders，重启回到种子数据）
const CONFIG = require('../config/index')
const serviceMock = require('./index')

let cache = null

function getStore() {
  if (cache) return cache
  const app = getApp()
  if (!app.globalData.mockOrders) app.globalData.mockOrders = []
  cache = app.globalData.mockOrders
  seed(cache)
  return cache
}

function genId() {
  return 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function genOrderNo() {
  const d = new Date()
  function p(n) { return n < 10 ? '0' + n : '' + n }
  return 'XJ' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
    p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) +
    Math.floor(Math.random() * 9000 + 1000)
}

function buildRecord(serviceId, specValue, quantity, remark, contact) {
  const svc = serviceMock.getServiceById(serviceId)
  const spec = svc.specs.find(function (s) { return s.value === Number(specValue) })
  const qty = Math.max(1, Number(quantity) || 1)
  const now = Date.now()
  return {
    id: genId(),
    orderNo: genOrderNo(),
    serviceId: svc.id,
    serviceTitle: svc.title,
    subtitle: svc.subtitle,
    modeName: svc.modeName,
    coverGradient: svc.coverGradient,
    coverText: svc.coverText,
    specLabel: spec.label,
    specValue: spec.value,
    quantity: qty,
    unitPrice: spec.price,
    amount: spec.price * qty,
    status: 'pending_pay',
    remark: remark || '',
    contact: contact || '',
    createdAt: now,
    payExpireAt: now + CONFIG.payTimeoutMinutes * 60 * 1000,
    paidAt: 0,
    startedAt: 0,
    completedAt: 0,
    cancelledAt: 0,
    refundReason: '',
    refundedAt: 0,
    // 预留：打手模块上线后填充
    serveBy: ''
  }
}

function seed(list) {
  if (list.length) return
  const now = Date.now()
  const hour = 3600 * 1000
  const rec1 = buildRecord('s001', 2, 1)
  rec1.createdAt = now - 2 * 60 * 1000
  rec1.payExpireAt = now + (CONFIG.payTimeoutMinutes - 2) * 60 * 1000

  const rec2 = buildRecord('s002', 1, 1)
  rec2.status = 'in_progress'
  rec2.createdAt = now - 2 * hour
  rec2.paidAt = now - 2 * hour + 5 * 60 * 1000
  rec2.startedAt = now - 2 * hour + 10 * 60 * 1000

  const rec3 = buildRecord('s004', 3, 2)
  rec3.status = 'completed'
  rec3.createdAt = now - 26 * hour
  rec3.paidAt = now - 26 * hour + 3 * 60 * 1000
  rec3.startedAt = now - 25 * hour
  rec3.completedAt = now - 23 * hour

  const rec4 = buildRecord('s003', 4, 1)
  rec4.status = 'refunding'
  rec4.createdAt = now - 6 * hour
  rec4.paidAt = now - 6 * hour + 2 * 60 * 1000
  rec4.refundReason = '服务不满意'

  list.push(rec1, rec2, rec3, rec4)
}

function clone(obj) {
  return obj ? JSON.parse(JSON.stringify(obj)) : null
}

/** 订单列表，status 为空或 'all' 返回全部（按创建时间倒序） */
function listOrders(status) {
  const list = getStore().slice().sort(function (a, b) { return b.createdAt - a.createdAt })
  if (status && status !== 'all') {
    return clone(list.filter(function (o) { return o.status === status }))
  }
  return clone(list)
}

function getOrder(id) {
  const found = getStore().find(function (o) { return o.id === id })
  return clone(found)
}

function createOrder(payload) {
  const rec = buildRecord(payload.serviceId, payload.specValue, payload.quantity, payload.remark, payload.contact)
  getStore().unshift(rec)
  return clone(rec)
}

function payOrder(id) {
  const o = getStore().find(function (item) { return item.id === id })
  if (o && o.status === 'pending_pay') {
    o.status = 'paid'
    o.paidAt = Date.now()
  }
  return clone(o)
}

function cancelOrder(id, reason) {
  const o = getStore().find(function (item) { return item.id === id })
  if (o && (o.status === 'pending_pay' || o.status === 'paid')) {
    o.status = 'cancelled'
    o.cancelledAt = Date.now()
    if (reason) o.remark = o.remark ? o.remark + '；' + reason : reason
  }
  return clone(o)
}

function completeOrder(id) {
  const o = getStore().find(function (item) { return item.id === id })
  if (o && o.status === 'in_progress') {
    o.status = 'completed'
    o.completedAt = Date.now()
  }
  return clone(o)
}

function applyRefund(id, payload) {
  const o = getStore().find(function (item) { return item.id === id })
  if (o && (o.status === 'paid' || o.status === 'in_progress' || o.status === 'completed')) {
    o.status = 'refunding'
    const detail = (payload && payload.detail) || ''
    o.refundReason = (payload && payload.reason) || '其他'
    if (detail) o.refundReason = o.refundReason + '：' + detail
  }
  return clone(o)
}

/** 个人中心订单统计 */
function getOrderCounts() {
  const list = getStore()
  function count(status) {
    return list.filter(function (o) { return o.status === status }).length
  }
  return {
    pending_pay: count('pending_pay'),
    in_progress: count('in_progress'),
    completed: count('completed')
  }
}

module.exports = {
  listOrders: listOrders,
  getOrder: getOrder,
  createOrder: createOrder,
  payOrder: payOrder,
  cancelOrder: cancelOrder,
  completeOrder: completeOrder,
  applyRefund: applyRefund,
  getOrderCounts: getOrderCounts
}
