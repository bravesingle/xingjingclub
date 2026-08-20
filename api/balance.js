// api/balance.js
// 用户余额：充值 / 激活码兑换
const request = require('../utils/request')

/** 充值（开发期 mock，amount 单位分） */
function recharge(amount) {
  return request.post('/user/recharge', { amount: amount })
}

/** 兑换激活码 */
function redeem(code) {
  return request.post('/user/redeem', { code: code })
}

module.exports = {
  recharge: recharge,
  redeem: redeem
}
