// pages/booster-chat/booster-chat.js
// 打手消息（tab index 1）：可聊天会话 = 服务中/已完成订单，按最近时间倒序
const boosterApi = require('../../api/booster')
const auth = require('../../utils/auth')
const format = require('../../utils/format')

Page({
  data: {
    sessions: [],   // 可聊天会话列表
    loading: true,
    needLogin: false
  },

  onShow() {
    // 自定义 tabBar：打手角色消息为第 2 个 tab
    if (this.getTabBar && this.getTabBar()) {
      this.getTabBar().refresh()
      this.getTabBar().setData({ selected: 1 })
    }
    const userInfo = auth.getUserInfo()
    const isBooster = !!(userInfo && userInfo.role === 'booster')
    // 未登录：显示登录引导
    if (!auth.isLoggedIn()) {
      this.setData({ sessions: [], loading: false, needLogin: true })
      return
    }
    // 已登录但非打手：跳回玩家首页
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

  /** 取服务中/已完成订单作为可聊天会话，加工状态徽标与最近时间 */
  load() {
    this.setData({ loading: true })
    return boosterApi.getMyOrders().then((list) => {
      const sessions = (list || [])
        .filter(function (o) {
          return o.status === 'in_progress' || o.status === 'completed'
        })
        .map(function (o) {
          const st = format.orderStatus(o.status)
          return Object.assign({}, o, {
            statusText: st.text,
            statusCls: st.cls,
            recentTs: this.recentTs(o),
            recentTimeText: format.formatTime(this.recentTs(o))
          })
        }, this)
        .sort(function (a, b) {
          return b.recentTs - a.recentTs
        })
      this.setData({ sessions: sessions, loading: false })
    }).catch(() => {
      // 失败：request.js 已统一 toast
      this.setData({ loading: false })
    })
  },

  /** 会话最近时间：完成时间 > 开始时间 > 支付时间 > 下单时间 */
  recentTs(o) {
    return o.completedAt || o.startedAt || o.paidAt || o.createdAt || 0
  },

  onPullDownRefresh() {
    this.load().then(() => {
      wx.stopPullDownRefresh()
    }).catch(() => {
      wx.stopPullDownRefresh()
    })
  },

  /** 进入聊天页 */
  onGoChat(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/chat/chat?orderId=' + encodeURIComponent(id) })
  }
})
