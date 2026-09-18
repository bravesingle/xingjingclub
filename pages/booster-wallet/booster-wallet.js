// pages/booster-wallet/booster-wallet.js
// 保证金页：查看/缴纳保证金（服务收入由平台线下统一结算，小程序内不含钱包与提现）
const boosterApi = require('../../api/booster')

const DEPOSIT_AMOUNT = 200 // 保证金金额（元），展示用

Page({
  data: {
    wallet: { deposited: false },
    depositAmount: DEPOSIT_AMOUNT,
    submitting: false
  },

  onLoad() {
    this.loadWallet()
  },

  onShow() {
    this.loadWallet()
  },

  /** 拉取保证金状态 */
  loadWallet() {
    boosterApi.getWallet().then((data) => {
      const w = data || {}
      this.setData({ wallet: { deposited: !!w.deposited } })
    }).catch(() => {
      // 失败时 request.js 已统一 toast，这里静默保留旧数据
    })
  },

  /** 缴纳保证金 */
  onPayDeposit() {
    if (this.data.submitting) return
    wx.showModal({
      title: '缴纳保证金',
      content: '确认缴纳 ¥' + DEPOSIT_AMOUNT + ' 保证金？缴纳后即可开始接单。',
      confirmText: '确认缴纳',
      confirmColor: '#63E6F7',
      success: (res) => {
        if (!res.confirm) return
        this.setData({ submitting: true })
        boosterApi.payDeposit().then(() => {
          // 微信支付已成功；入账由微信回调后端完成，轮询确认状态
          this.pollDeposit(3)
        }).catch((err) => {
          const msg = (err && err.errMsg) || ''
          // 用户主动取消支付：静默处理（request.js 已提示其它错误）
          if (msg.indexOf('cancel') === -1 && !(err && err.msg)) {
            wx.showToast({ title: '支付未完成', icon: 'none' })
          }
        }).then(() => {
          this.setData({ submitting: false })
        })
      }
    })
  },

  /** 支付成功后轮询保证金状态（微信回调到账略有延迟） */
  pollDeposit(times) {
    if (times <= 0) {
      wx.showToast({ title: '支付处理中，请稍后刷新', icon: 'none' })
      return
    }
    setTimeout(() => {
      boosterApi.getWallet().then((data) => {
        const deposited = !!(data && data.deposited)
        this.setData({ wallet: { deposited: deposited } })
        if (deposited) {
          wx.showToast({ title: '保证金缴纳成功', icon: 'success' })
        } else {
          this.pollDeposit(times - 1)
        }
      }).catch(() => {
        this.pollDeposit(times - 1)
      })
    }, 1500)
  }
})
