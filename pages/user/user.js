// pages/user/user.js
// 个人中心（tab 页）：顶部资料卡 / 订单统计 / 功能菜单 / 版本信息
const config = require('../../config/index')
const auth = require('../../utils/auth')
const userApi = require('../../api/user')
const orderApi = require('../../api/order')
const format = require('../../utils/format')

Page({
  data: {
    userInfo: null,
    avatarText: '👤',
    balanceYuan: '0.00',
    counts: { pending_pay: 0, in_progress: 0, completed: 0 },
    brand: config.brand,
    servicePhone: config.customerServicePhone,
    version: config.version
  },

  onShow() {
    // 自定义 tabBar：玩家/服务方角色下"我的"均为第 3 个 tab
    if (this.getTabBar && this.getTabBar()) {
      this.getTabBar().refresh()
      this.getTabBar().setData({ selected: 2 })
    }
    this.loadUser()
    this.loadCounts()
  },

  /** 读取用户信息（缓存或 globalData），未登录为 null */
  loadUser() {
    let userInfo = auth.getUserInfo()
    if (!userInfo) {
      const app = getApp()
      userInfo = app && app.globalData.userInfo
    }
    userInfo = userInfo || null
    let avatarText = '👤'
    if (userInfo && userInfo.nickname) {
      avatarText = userInfo.nickname.charAt(0)
    }
    // 服务方角色判断（决定"我的"页服务方入口：工作台/钱包 or 申请成为服务方）
    const isBooster = !!(userInfo && userInfo.role === 'booster')
    const balanceYuan = format.fenToYuan((userInfo && userInfo.balance) || 0)
    this.setData({
      userInfo: userInfo,
      avatarText: avatarText,
      isBooster: isBooster,
      balanceYuan: balanceYuan
    })
  },

  /** 余额页 */
  onBalance() {
    if (!auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    wx.navigateTo({ url: '/pages/balance/balance' })
  },

  /** 加载订单统计（未登录不发请求，避免 401 触发跳登录） */
  loadCounts() {
    if (!auth.isLoggedIn()) {
      this.setData({ counts: { pending_pay: 0, in_progress: 0, completed: 0 } })
      return
    }
    orderApi.getOrderCounts().then((counts) => {
      this.setData({ counts: counts || this.data.counts })
    }).catch(() => {
      // 统计失败静默，保留旧值
    })
  },

  /** 顶部资料卡：未登录去登录；已登录弹窗完善游戏ID */
  onCardTap() {
    const userInfo = this.data.userInfo
    if (!userInfo) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    wx.showModal({
      title: '完善游戏ID',
      editable: true,
      placeholderText: '请输入三角洲行动游戏ID',
      content: userInfo.gameId || '',
      success: (res) => {
        if (!res.confirm) return
        const gameId = (res.content || '').trim()
        if (!gameId) {
          wx.showToast({ title: '游戏ID不能为空', icon: 'none' })
          return
        }
        userApi.updateUserInfo({ gameId: gameId }).then(() => {
          wx.showToast({ title: '已保存', icon: 'success' })
          this.loadUser()
        }).catch(() => {
          wx.showToast({ title: '保存失败，请重试', icon: 'none' })
        })
      }
    })
  },

  /** 统计列点击：记录订单页 tab 并跳转 */
  onCountTap(e) {
    const status = e.currentTarget.dataset.status
    wx.setStorageSync('xjes_order_tab', status)
    wx.switchTab({ url: '/pages/order-list/order-list' })
  },

  /** 我的订单（服务方 → 工作台"我的订单"；玩家 → 订单列表） */
  onAllOrders() {
    if (this.data.isBooster) {
      wx.setStorageSync('xjes_booster_tab', 'mine')
      wx.switchTab({ url: '/pages/booster-work/booster-work' })
    } else {
      wx.setStorageSync('xjes_order_tab', 'all')
      wx.switchTab({ url: '/pages/order-list/order-list' })
    }
  },

  /** 工作台（tab 页） */
  onBoosterWork() {
    wx.switchTab({ url: '/pages/booster-work/booster-work' })
  },

  /** 服务钱包 */
  onBoosterWallet() {
    wx.navigateTo({ url: '/pages/booster-wallet/booster-wallet' })
  },

  /** 申请成为服务方（入驻申请） */
  onBoosterApply() {
    wx.navigateTo({ url: '/pages/booster-apply/booster-apply' })
  },

  /** 联系客服：拨打客服电话 */
  onContact() {
    wx.makePhoneCall({
      phoneNumber: config.customerServicePhone,
      fail: () => {
        // 用户取消拨号无需提示
      }
    })
  },

  /** 关于星竞 */
  onAbout() {
    const content = config.brandSlogan + '\n游戏：' + config.gameName + '\n版本：v' + config.version
    wx.showModal({
      title: config.brand,
      content: content,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /** 清除缓存：确认后清除本地登录态并退出 */
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除本地缓存并退出登录，确定继续吗？',
      success: (res) => {
        if (!res.confirm) return
        userApi.logout().then(() => {
          wx.showToast({ title: '已清除', icon: 'success' })
          this.refreshAll()
          // 退出后回到玩家默认首页（避免停留在服务方界面）
          wx.switchTab({ url: '/pages/index/index' })
        })
      }
    })
  },

  /** 退出登录（仅已登录时显示） */
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmColor: '#FF5B6A',
      success: (res) => {
        if (!res.confirm) return
        userApi.logout().then(() => {
          wx.showToast({ title: '已退出', icon: 'success' })
          this.refreshAll()
          // 退出后回到玩家默认首页
          wx.switchTab({ url: '/pages/index/index' })
        })
      }
    })
  },

  /** 刷新页面数据 */
  refreshAll() {
    this.loadUser()
    this.loadCounts()
  }
})
