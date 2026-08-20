// pages/order-list/order-list.js
// 订单列表（tab 页）：横向状态 tab + 订单卡片列表 + 下拉刷新
const orderApi = require('../../api/order')
const auth = require('../../utils/auth')
const config = require('../../config/index')

Page({
  data: {
    tabs: [
      { key: 'all', name: '全部' },
      { key: 'pending_pay', name: '待支付' },
      { key: 'in_progress', name: '服务中' },
      { key: 'completed', name: '已完成' },
      { key: 'refunding', name: '退款中' },
      { key: 'cancelled', name: '已取消' }
    ],
    activeTab: 'all',
    list: [],
    loading: true,
    needLogin: false
  },

  onShow() {
    // 自定义 tabBar：玩家角色下订单为第 2 个 tab
    if (this.getTabBar && this.getTabBar()) {
      this.getTabBar().refresh()
      this.getTabBar().setData({ selected: 1 })
    }
    // 个人中心跳转时写入的筛选值
    const tab = wx.getStorageSync('xjes_order_tab')
    if (tab) {
      wx.removeStorageSync('xjes_order_tab')
      this.setData({ activeTab: tab })
    }
    // 未登录：不请求接口，显示登录引导（订单接口需要 JWT，未登录会 401）
    if (!auth.isLoggedIn()) {
      this.setData({ list: [], loading: false, needLogin: true })
      return
    }
    this.setData({ needLogin: false })
    this.load()
  },

  onTabTap(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.activeTab) return
    this.setData({ activeTab: key })
    if (this.data.needLogin) return
    this.load()
  },

  onGoLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  load() {
    this.setData({ loading: true })
    orderApi.getOrderList(this.data.activeTab).then((list) => {
      this.setData({ list: list || [], loading: false })
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    })
  },

  onPullDownRefresh() {
    orderApi.getOrderList(this.data.activeTab).then((list) => {
      this.setData({ list: list || [] })
      wx.stopPullDownRefresh()
    }).catch(() => {
      wx.stopPullDownRefresh()
    })
  },

  onCardPay(e) {
    const order = e.detail.order
    if (!order) return
    wx.redirectTo({
      url: '/pages/order-pay/order-pay?orderId=' + encodeURIComponent(order.id)
    })
  },

  onCardCancel(e) {
    const order = e.detail.order
    if (!order) return
    wx.showModal({
      title: '取消订单',
      content: '确定取消该订单吗？取消后如需服务需重新下单',
      success: (res) => {
        if (!res.confirm) return
        orderApi.cancelOrder(order.id).then(() => {
          wx.showToast({ title: '订单已取消', icon: 'success' })
          this.load()
        }).catch(() => {
          wx.showToast({ title: '取消失败，请重试', icon: 'none' })
        })
      }
    })
  },

  onCardContact() {
    wx.setClipboardData({
      data: config.customerServiceWechat,
      success: () => {
        wx.showToast({ title: '客服微信已复制', icon: 'none' })
      }
    })
  },

  onCardAgain(e) {
    const order = e.detail.order
    if (!order) return
    wx.navigateTo({
      url: '/pages/service-detail/service-detail?id=' + encodeURIComponent(order.serviceId)
    })
  }
})
