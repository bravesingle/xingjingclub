// pages/booster-work/booster-work.js
// 工作台（tab index 0）：待接单池 / 我的订单 / 保证金状态 / 下拉刷新
const boosterApi = require('../../api/booster')
const auth = require('../../utils/auth')
const format = require('../../utils/format')

Page({
  data: {
    tab: 'pool',      // pool 待接单 / mine 我的订单
    pool: [],         // 待接单池
    mine: [],         // 我的订单
    loading: true,
    deposited: true,  // 保证金是否已缴纳（getWallet.deposited）
    needLogin: false
  },

  onShow() {
    // 自定义 tabBar：服务方角色工作台为第 1 个 tab
    if (this.getTabBar && this.getTabBar()) {
      this.getTabBar().refresh()
      this.getTabBar().setData({ selected: 0 })
    }
    // 从"我的-我的订单"跳转时，定位到"我的订单"tab
    const boosterTab = wx.getStorageSync('xjes_booster_tab')
    if (boosterTab) {
      wx.removeStorageSync('xjes_booster_tab')
      this.setData({ tab: boosterTab })
    }
    const userInfo = auth.getUserInfo()
    const isBooster = !!(userInfo && userInfo.role === 'booster')
    // 未登录：显示登录引导
    if (!auth.isLoggedIn()) {
      this.setData({ pool: [], mine: [], loading: false, needLogin: true })
      return
    }
    // 已登录但非服务方：跳回玩家首页
    if (!isBooster) {
      wx.switchTab({ url: '/pages/index/index' })
      return
    }
    this.setData({ needLogin: false })
    this.load()
  },

  onGoLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  /** 顶部 tab 切换：切换时刷新数据，保证订单状态最新 */
  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.tab) return
    this.setData({ tab: tab })
    this.load()
  },

  /** 并行加载：待接单池 + 我的订单 + 钱包保证金状态 */
  load() {
    this.setData({ loading: true })
    return Promise.all([
      boosterApi.getPool().catch(() => []),
      boosterApi.getMyOrders().catch(() => []),
      boosterApi.getWallet().catch(() => null)
    ]).then((res) => {
      this.setData({
        pool: this.decoratePool(res[0] || []),
        mine: this.decorateMine(res[1] || []),
        deposited: !!(res[2] && res[2].deposited),
        loading: false
      })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  onPullDownRefresh() {
    this.load().then(() => {
      wx.stopPullDownRefresh()
    }).catch(() => {
      wx.stopPullDownRefresh()
    })
  },

  /** 待接单池：金额分→元、下单时间格式化 */
  decoratePool(list) {
    return list.map(function (o) {
      return Object.assign({}, o, {
        amountText: format.fenToYuan(o.amount),
        createdAtText: format.formatTime(o.createdAt)
      })
    })
  },

  /** 我的订单：金额 + 状态徽标（format.orderStatus）+ 接单时间 */
  decorateMine(list) {
    return list.map(function (o) {
      const st = format.orderStatus(o.status)
      return Object.assign({}, o, {
        amountText: format.fenToYuan(o.amount),
        statusText: st.text,
        statusCls: st.cls,
        acceptTimeText: format.formatTime(o.startedAt || o.acceptedAt || o.paidAt || o.createdAt)
      })
    })
  },

  /** 去缴纳保证金 */
  onGoDeposit() {
    wx.navigateTo({ url: '/pages/booster-wallet/booster-wallet' })
  },

  /** 接单：先确认（未交保证金先引导缴纳），成功后刷新 */
  onAccept(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    if (!this.data.deposited) {
      this.promptDeposit()
      return
    }
    wx.showModal({
      title: '确认接单',
      content: '确定接下该订单吗？接单后请按时完成服务',
      success: (res) => {
        if (!res.confirm) return
        boosterApi.acceptOrder(id).then(() => {
          wx.showToast({ title: '接单成功', icon: 'success' })
          this.load()
        }).catch((err) => {
          // 失败：request.js 已统一 toast 错误信息；保证金相关错误额外引导去钱包
          const msg = (err && err.msg) || ''
          if (msg.indexOf('保证金') > -1 || msg.indexOf('deposit') > -1) {
            this.setData({ deposited: false })
            this.promptDeposit()
          }
        })
      }
    })
  },

  /** 保证金引导弹窗 */
  promptDeposit() {
    wx.showModal({
      title: '缴纳保证金',
      content: '尚未缴纳保证金，无法接单，是否前往缴纳？',
      confirmText: '去缴纳',
      confirmColor: '#63E6F7',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ url: '/pages/booster-wallet/booster-wallet' })
        }
      }
    })
  },

  /** 跳转订单详情 */
  onGoDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + encodeURIComponent(id) })
  }
})
