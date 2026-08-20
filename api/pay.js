// api/pay.js
// 支付接口
// 开发期免真实支付：
//   - useMock=true（完全不连后端）→ 本地 mock 直接改订单状态
//   - useMock=false（对接后端）→ 调后端 POST /pay/mock（后端 PAY_MOCK=true 时即模拟支付，
//     订单真实存 MySQL，支付后状态在后端流转）
// 真实微信支付（商户接入后）：
//   1. createPayment 获取 payParams → 2. wx.requestPayment 拉起支付 → 3. queryPayResult 轮询兜底
const request = require('../utils/request')
const orderMock = require('../mock/order')
const config = require('../config/index')

function useMock() {
  return config.useMock
}

/**
 * 获取微信支付参数
 * 返回结构（真实后端契约）:
 * { payParams: { timeStamp, nonceStr, package, signType, paySign } }
 */
function createPayment(orderId) {
  return request.post('/pay/wechat/prepay', { orderId: orderId })
}

/** 模拟支付（开发期）：对接后端 /pay/mock，订单真实流转为已支付 */
function mockPay(orderId) {
  if (useMock()) {
    const order = orderMock.payOrder(orderId)
    return Promise.resolve({
      paid: !!(order && order.status === 'paid'),
      order: order
    })
  }
  return request.post('/pay/mock', { orderId: orderId })
}

/** 余额支付 */
function payByBalance(orderId) {
  return request.post('/pay/balance', { orderId: orderId })
}

/** 查询支付结果（真实链路兜底轮询） */
function queryPayResult(orderId) {
  if (useMock()) {
    const order = orderMock.getOrder(orderId)
    return Promise.resolve({ paid: !!(order && order.status === 'paid') })
  }
  return request.get('/pay/result', { orderId: orderId })
}

module.exports = {
  createPayment: createPayment,
  mockPay: mockPay,
  payByBalance: payByBalance,
  queryPayResult: queryPayResult
}
