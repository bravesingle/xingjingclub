// api/booster.js
// 打手相关接口（入驻/工作台/接单/押金/钱包/提现）
const request = require('../utils/request')

/** 打手入驻申请 */
function applyBooster(payload) {
  return request.post('/auth/apply-booster', payload)
}

/** 玩家端：打手列表（支持昵称/ID/游戏ID 搜索） */
function getBoosters(keyword) {
  const data = keyword ? { keyword: keyword } : {}
  return request.get('/boosters', data)
}

/** 玩家端：打手详情 */
function getBoosterDetail(id) {
  return request.get('/boosters/' + id)
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

/**
 * 缴纳保证金：向平台预下单 → 拉起微信支付
 * - PAY_MOCK=true：后端直接标记已缴纳（payParams 为空）
 * - 真实环境：返回 payParams，前端拉起微信支付；支付结果由微信回调后端更新
 */
function payDeposit() {
  return request.post('/pay/wechat/deposit').then(function (res) {
    if (!res || !res.payParams) return res
    return new Promise(function (resolve, reject) {
      wx.requestPayment({
        timeStamp: res.payParams.timeStamp,
        nonceStr: res.payParams.nonceStr,
        package: res.payParams.package,
        signType: res.payParams.signType,
        paySign: res.payParams.paySign,
        success: function () {
          resolve(res)
        },
        fail: function (err) {
          reject(err)
        }
      })
    })
  })
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
  getBoosters: getBoosters,
  getBoosterDetail: getBoosterDetail,
  getPool: getPool,
  getMyOrders: getMyOrders,
  acceptOrder: acceptOrder,
  payDeposit: payDeposit,
  getWallet: getWallet,
  withdraw: withdraw
}
