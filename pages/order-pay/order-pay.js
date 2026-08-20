// pages/order-pay/order-pay.js
// 收银台：金额展示 + 支付倒计时 + 支付方式 + 确认支付（模拟/真实微信支付）
const orderApi = require('../../api/order')
const payApi = require('../../api/pay')
const auth = require('../../utils/auth')
const config = require('../../config/index')
const format = require('../../utils/format')

Page({
  data: {
    order: null,
    orderId: '',
    amountText: '0.00',
    payMethod: 'wechat',
    mockPayEnabled: config.useMockPay,
    expired: false,
    submitting: false,
    balanceYuan: '0.00'
  },

  onLoad(options) {
    const orderId = decodeURIComponent(options.orderId || '')
    this.setData({ orderId: orderId })
    const userInfo = auth.getUserInfo()
    this.setData({ balanceYuan: format.fenToYuan((userInfo && userInfo.balance) || 0) })
    this.loadOrder(orderId)
  },

  loadOrder(orderId) {
    orderApi.getOrderDetail(orderId).then((order) => {
      if (!order) {
        wx.showToast({ title: '订单不存在', icon: 'none' })
        return
      }
      // 非待支付订单（已支付/已取消等）不留在收银台
      if (order.status !== 'pending_pay') {
        wx.redirectTo({
          url: '/pages/order-detail/order-detail?id=' + encodeURIComponent(orderId)
        })
        return
      }
      this.setData({
        order: order,
        amountText: format.fenToYuan(order.amount)
      })
    }).catch(() => {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    })
  },

  onSelectMethod(e) {
    this.setData({ payMethod: e.currentTarget.dataset.method })
  },

  onCountdownFinish() {
    this.setData({ expired: true })
    wx.showToast({ title: '订单已超时，已自动取消', icon: 'none' })
  },

  onLater() {
    wx.navigateBack()
  },

  _gotoDetail(orderId) {
    wx.redirectTo({
      url: '/pages/order-detail/order-detail?id=' + encodeURIComponent(orderId)
    })
  },

  doPay() {
    if (this.data.expired || this.data.submitting) return
    const orderId = this.data.orderId
    this.setData({ submitting: true })

    // 余额支付
    if (this.data.payMethod === 'balance') {
      payApi.payByBalance(orderId).then((res) => {
        this.setData({ submitting: false })
        if (res && res.paid) {
          wx.showToast({ title: '支付成功', icon: 'success' })
          setTimeout(() => { this._gotoDetail(orderId) }, 600)
        } else {
          wx.showToast({ title: '支付失败', icon: 'none' })
        }
      }).catch(() => {
        this.setData({ submitting: false })
        wx.showToast({ title: '余额不足，请先充值', icon: 'none' })
      })
      return
    }

    if (this.data.mockPayEnabled) {
      // 模拟支付（开发期）
      payApi.mockPay(orderId).then((res) => {
        this.setData({ submitting: false })
        if (res && res.paid) {
          wx.showToast({ title: '支付成功', icon: 'success' })
          setTimeout(() => { this._gotoDetail(orderId) }, 600)
        } else {
          wx.showToast({ title: '支付失败', icon: 'none' })
        }
      }).catch(() => {
        this.setData({ submitting: false })
        wx.showToast({ title: '支付失败', icon: 'none' })
      })
      return
    }

    // 真实微信支付
    payApi.createPayment(orderId).then((res) => {
      const payParams = (res && res.payParams) || null
      if (!payParams) {
        this.setData({ submitting: false })
        wx.showToast({ title: '支付参数异常', icon: 'none' })
        return
      }
      wx.requestPayment({
        timeStamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.package,
        signType: payParams.signType,
        paySign: payParams.paySign,
        success: () => {
          this.setData({ submitting: false })
          wx.showToast({ title: '支付成功', icon: 'success' })
          setTimeout(() => { this._gotoDetail(orderId) }, 600)
        },
        fail: (err) => {
          this.setData({ submitting: false })
          const msg = (err && err.errMsg) || ''
          if (msg.indexOf('cancel') > -1) return
          wx.showToast({ title: '支付失败', icon: 'none' })
        }
      })
    }).catch(() => {
      this.setData({ submitting: false })
      wx.showToast({ title: '支付失败', icon: 'none' })
    })
  }
})
