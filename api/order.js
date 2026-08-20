// api/order.js
// 订单接口（下单 / 列表 / 详情 / 取消 / 完成 / 退款 / 统计）
// 后端契约：GET /orders?status=&page=&pageSize= 返回 { list, total }
const request = require('../utils/request')
const mock = require('../mock/order')
const config = require('../config/index')

function useMock() {
  return config.useMock
}

/** 创建订单：{ serviceId, specValue, quantity, remark, contact } */
function createOrder(payload) {
  if (useMock()) return Promise.resolve(mock.createOrder(payload))
  return request.post('/orders', payload)
}

/** 订单列表：status 为空或 'all' 返回全部 → 返回数组 */
function getOrderList(status) {
  if (useMock()) return Promise.resolve(mock.listOrders(status))
  return request
    .get('/orders', { status: status && status !== 'all' ? status : '', page: 1, pageSize: 200 })
    .then(function (res) {
      return (res && res.list) || []
    })
}

/** 订单详情 */
function getOrderDetail(id) {
  if (useMock()) return Promise.resolve(mock.getOrder(id))
  return request.get('/orders/' + id)
}

/** 取消订单 */
function cancelOrder(id, reason) {
  if (useMock()) return Promise.resolve(mock.cancelOrder(id, reason))
  return request.post('/orders/' + id + '/cancel', { reason: reason })
}

/** 确认完成（服务中 -> 已完成） */
function completeOrder(id) {
  if (useMock()) return Promise.resolve(mock.completeOrder(id))
  return request.post('/orders/' + id + '/complete')
}

/** 申请退款：{ reason, detail } */
function applyRefund(id, payload) {
  if (useMock()) return Promise.resolve(mock.applyRefund(id, payload))
  return request.post('/orders/' + id + '/refund', payload)
}

/** 个人中心订单统计：{ pending_pay, in_progress, completed } */
function getOrderCounts() {
  if (useMock()) return Promise.resolve(mock.getOrderCounts())
  return request.get('/orders/counts')
}

module.exports = {
  createOrder: createOrder,
  getOrderList: getOrderList,
  getOrderDetail: getOrderDetail,
  cancelOrder: cancelOrder,
  completeOrder: completeOrder,
  applyRefund: applyRefund,
  getOrderCounts: getOrderCounts
}
