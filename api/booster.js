// api/booster.js
// 打手相关接口（入驻/工作台/接单/押金/钱包/提现）
const request = require('../utils/request')

/** 打手入驻申请 */
function applyBooster(payload) {
  return request.post('/auth/apply-booster', payload)
}

/** 工作台：待接单订单池 */
function getPool() {
  return request.get('/booster/orders/pool')
}

/** 工作台：我的已接订单 */
function getMyOrders() {
  return request.get('/booster/orders/mine')
}

/** 接单 */
function acceptOrder(orderId) {
  return request.post('/booster/orders/' + orderId + '/accept')
}

/** 缴纳押金 */
function payDeposit() {
  return request.post('/booster/deposit/pay')
}

/** 钱包（余额/冻结/总收入/押金状态） */
function getWallet() {
  return request.get('/booster/wallet')
}

/** 申请提现 */
function withdraw(amount) {
  return request.post('/booster/withdraw', { amount: amount, channel: 'wechat' })
}

module.exports = {
  applyBooster: applyBooster,
  getPool: getPool,
  getMyOrders: getMyOrders,
  acceptOrder: acceptOrder,
  payDeposit: payDeposit,
  getWallet: getWallet,
  withdraw: withdraw
}
