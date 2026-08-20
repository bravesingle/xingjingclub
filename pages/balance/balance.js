// pages/balance/balance.js
// 余额页：查看余额 + 充值 + 激活码兑换
const balanceApi = require('../../api/balance')
const auth = require('../../utils/auth')
const format = require('../../utils/format')

Page({
  data: {
    balanceYuan: '0.00',
    rechargeAmount: '',   // 充值金额（元）
    redeemCode: '',
    submitting: false
  },

  onShow() {
    this.refreshBalance()
  },

  refreshBalance() {
    const userInfo = auth.getUserInfo()
    this.setData({
      balanceYuan: format.fenToYuan((userInfo && userInfo.balance) || 0)
    })
  },

  onRechargeInput(e) {
    this.setData({ rechargeAmount: e.detail.value })
  },

  onRedeemInput(e) {
    this.setData({ redeemCode: e.detail.value })
  },

  /** 充值：元 → 分 */
  onRecharge() {
    if (this.data.submitting) return
    const yuan = parseFloat(this.data.rechargeAmount)
    if (isNaN(yuan) || yuan <= 0) {
      wx.showToast({ title: '请输入充值金额', icon: 'none' })
      return
    }
    const fen = Math.round(yuan * 100)
    this.setData({ submitting: true })
    balanceApi.recharge(fen).then((res) => {
      wx.showToast({ title: '充值成功', icon: 'success' })
      // 更新本地余额
      const userInfo = auth.getUserInfo()
      if (userInfo && res && res.balance !== undefined) {
        userInfo.balance = res.balance
        auth.setUserInfo(userInfo)
        const app = getApp()
        if (app) app.globalData.userInfo = userInfo
      }
      this.setData({ rechargeAmount: '' })
      this.refreshBalance()
    }).catch(() => {}).then(() => {
      this.setData({ submitting: false })
    })
  },

  /** 兑换激活码 */
  onRedeem() {
    if (this.data.submitting) return
    const code = this.data.redeemCode.trim()
    if (!code) {
      wx.showToast({ title: '请输入激活码', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    balanceApi.redeem(code).then((res) => {
      wx.showToast({ title: '兑换成功，余额已增加', icon: 'success' })
      const userInfo = auth.getUserInfo()
      if (userInfo && res && res.balance !== undefined) {
        userInfo.balance = res.balance
        auth.setUserInfo(userInfo)
        const app = getApp()
        if (app) app.globalData.userInfo = userInfo
      }
      this.setData({ redeemCode: '' })
      this.refreshBalance()
    }).catch(() => {}).then(() => {
      this.setData({ submitting: false })
    })
  }
})
