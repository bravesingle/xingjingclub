// pages/index/index.js
// 首页：轮播 + 分类九宫格 + 热门服务
const serviceApi = require('../../api/service')
const config = require('../../config/index')
const format = require('../../utils/format')

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
      // banner cover 相对路径转完整 URL（有图优先显示图片）
      const banners = ((res && res.banners) || []).map(function (b) {
        return Object.assign({}, b, { coverUrl: format.coverUrl(b.cover) })
      })
      this.setData({
        banners: banners,
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

  /** Banner 点击：按 linkType 跳转（service 详情 / category 分类 / page 优惠页） */
  onBannerTap(e) {
    const type = e.currentTarget.dataset.linkType
    const id = e.currentTarget.dataset.linkId
    if (type === 'service' && id) {
      wx.navigateTo({ url: '/pages/service-detail/service-detail?id=' + encodeURIComponent(id) })
    } else if (type === 'category' && id) {
      wx.navigateTo({ url: '/pages/service-list/service-list?category=' + encodeURIComponent(id) })
    } else if (type === 'page') {
      // 优惠页：先跳「查看全部」服务列表（后续如有独立优惠页再改）
      wx.navigateTo({ url: '/pages/service-list/service-list' })
    } else {
      wx.navigateTo({ url: '/pages/service-list/service-list' })
    }
  },

  /** 查看全部服务 */
  onViewAll() {
    wx.navigateTo({
      url: '/pages/service-list/service-list?category=all'
    })
  }
})
