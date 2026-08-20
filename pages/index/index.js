// pages/index/index.js
// 首页：轮播 + 分类九宫格 + 热门陪玩
const serviceApi = require('../../api/service')
const config = require('../../config/index')

Page({
  data: {
    banners: [],
    categories: [],
    hotServices: [],
    loading: true,
    brand: config.brand,
    gameName: config.gameName,
    brandSlogan: config.brandSlogan
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    if (this.getTabBar && this.getTabBar()) {
      this.getTabBar().refresh()
      this.getTabBar().setData({ selected: 0 })
    }
  },

  onPullDownRefresh() {
    this.loadData(function () {
      wx.stopPullDownRefresh()
    })
  },

  loadData(cb) {
    this.setData({ loading: true })
    serviceApi.getHomeData().then((res) => {
      this.setData({
        banners: (res && res.banners) || [],
        categories: (res && res.categories) || [],
        hotServices: (res && res.hotServices) || [],
        loading: false
      })
      if (cb) cb()
    }).catch(() => {
      this.setData({ loading: false })
      if (cb) cb()
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    })
  },

  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/service-list/service-list?category=' + encodeURIComponent(id)
    })
  },

  /** 查看全部服务 */
  onViewAll() {
    wx.navigateTo({
      url: '/pages/service-list/service-list?category=all'
    })
  }
})
