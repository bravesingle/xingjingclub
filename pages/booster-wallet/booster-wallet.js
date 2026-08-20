// pages/booster-wallet/booster-wallet.js
// 打手钱包：余额 / 冻结 / 累计收入 / 已提现 / 押金 / 提现
const boosterApi = require('../../api/booster')
const { fenToYuan } = require('../../utils/format')

const DEPOSIT_AMOUNT = 200 // 押金金额（元），展示用

Page({
  data: {
    wallet: { balance: 0, frozen: 0, totalIncome: 0, withdrawn: 0, deposited: false },
    balanceYuan: '0.00',
    frozenYuan: '0.00',
    totalIncomeYuan: '0.00',
    withdrawnYuan: '0.00',
    depositAmount: DEPOSIT_AMOUNT,
    canWithdraw: false,
    withdrawBtnText: '提现',
    submitting: false
  },

  onLoad() {
    this.loadWallet()
  },

  onShow() {
    this.loadWallet()
  },

  /** 拉取钱包数据并格式化金额（分 → 元） */
  loadWallet() {
    boosterApi.getWallet().then((data) => {
      const w = data || {}
      const wallet = {
        balance: Number(w.balance) || 0,
        frozen: Number(w.frozen) || 0,
        totalIncome: Number(w.total) || 0,
        withdrawn: Number(w.withdrawnTotal) || 0,
        deposited: !!w.deposited
      }
      this.applyWallet(wallet)
    }).catch(() => {
      // 失败时 request.js 已统一 toast，这里静默保留旧数据
    })
  },

  /** 钱包数据写入视图（含提现按钮态） */
  applyWallet(wallet) {
    const canWithdraw = wallet.deposited && wallet.balance > 0
    this.setData({
      wallet: wallet,
      balanceYuan: fenToYuan(wallet.balance),
      frozenYuan: fenToYuan(wallet.frozen),
      totalIncomeYuan: fenToYuan(wallet.totalIncome),
      withdrawnYuan: fenToYuan(wallet.withdrawn),
      canWithdraw: canWithdraw,
      withdrawBtnText: canWithdraw ? '提现' : '请先缴纳押金'
    })
  },

  /** 缴纳押金 */
  onPayDeposit() {
    wx.showModal({
      title: '缴纳押金',
      content: '确认缴纳 ¥' + DEPOSIT_AMOUNT + ' 押金？缴纳后可接单与提现。',
      confirmText: '确认缴纳',
      confirmColor: '#FFD34D',
      success: (res) => {
        if (!res.confirm) return
        boosterApi.payDeposit().then(() => {
          wx.showToast({ title: '押金缴纳成功', icon: 'success' })
          this.loadWallet()
        }).catch(() => {
          // 失败：request.js 已统一 toast
        })
      }
    })
  },

  /** 申请提现：弹输入框，用户输入"元"，提交时转"分"（接口 amount 单位为分） */
  onWithdraw() {
    if (this.data.submitting) return
    if (!this.data.wallet.deposited) {
      wx.showToast({ title: '请先缴纳押金', icon: 'none' })
      return
    }
    const balance = this.data.wallet.balance
    if (balance <= 0) {
      wx.showToast({ title: '暂无可提现余额', icon: 'none' })
      return
    }
    wx.showModal({
      title: '申请提现',
      editable: true,
      placeholderText: '请输入提现金额（元）',
      success: (res) => {
        if (!res.confirm) return
        const yuan = parseFloat((res.content || '').trim())
        if (isNaN(yuan) || yuan <= 0) {
          wx.showToast({ title: '请输入有效金额', icon: 'none' })
          return
        }
        // 元 → 分：Math.round 规避浮点误差
        const fen = Math.round(yuan * 100)
        if (fen > balance) {
          wx.showToast({ title: '提现金额超出可提现余额', icon: 'none' })
          return
        }
        this.setData({ submitting: true, withdrawBtnText: '提交中...' })
        boosterApi.withdraw(fen).then(() => {
          wx.showToast({ title: '提现申请已提交', icon: 'success' })
          this.loadWallet()
        }).catch(() => {
          // 失败：request.js 已统一 toast
        }).then(() => {
          // 兜底恢复按钮态（loadWallet 成功时会重设）
          this.setData({ submitting: false })
          if (this.data.canWithdraw) {
            this.setData({ withdrawBtnText: '提现' })
          }
        })
      }
    })
  }
})
