// pages/service-list/service-list.js
// 服务列表：分类 tab + 排序 + 卡片列表
const serviceApi = require('../../api/service')
const mock = require('../../mock/index')

Page({
  data: {
    categories: [],
    activeCategory: 'all',
    sort: 'sales',
    list: [],
    loading: true
  },

  onLoad(options) {
    const categories = [{ id: 'all', name: '全部' }].concat(mock.CATEGORIES)
    const category = decodeURIComponent((options && options.category) || 'all')
    this.setData({ categories: categories, activeCategory: category })
    this.load()
  },

  onPullDownRefresh() {
    this.load(function () {
      wx.stopPullDownRefresh()
    })
  },

  load(cb) {
    this.setData({ loading: true })
    serviceApi.getServiceList({
      category: this.data.activeCategory,
      sort: this.data.sort
    }).then((list) => {
      this.setData({ list: list || [], loading: false })
      if (cb) cb()
    }).catch(() => {
      this.setData({ list: [], loading: false })
      if (cb) cb()
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    })
  },

  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.activeCategory) return
    this.setData({ activeCategory: id })
    this.load()
  },

  onSortTap(e) {
    const sort = e.currentTarget.dataset.sort
    if (sort === this.data.sort) return
    this.setData({ sort: sort })
    this.load()
  }
})
