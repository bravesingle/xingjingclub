// pages/service-detail/service-detail.js
// 服务详情：规格选择 + 数量 + 规则 + 客服/下单
const serviceApi = require('../../api/service')
const config = require('../../config/index')
const auth = require('../../utils/auth')
const format = require('../../utils/format')

Page({
  data: {
    service: null,
    selectedIndex: 0,
    quantity: 1,
    total: 0,
    totalText: '0.00',
    showRules: false,
    customerServicePhone: config.customerServicePhone
  },

  onLoad(options) {
    const id = decodeURIComponent((options && options.id) || '')
    this.loadDetail(id)
  },

  loadDetail(id) {
    serviceApi.getServiceDetail(id).then((service) => {
      if (!service) {
        wx.showToast({ title: '服务不存在', icon: 'none' })
        setTimeout(function () {
          wx.navigateBack()
        }, 1500)
        return
      }
      // 规格补充展示用价格文本（分 -> 元）
      const specs = []
      service.specs.forEach(function (s) {
        specs.push({
          value: s.value,
          label: s.label,
          price: s.price,
          priceText: format.fenToYuan(s.price)
        })
      })
      service.specs = specs
      // 封面图片完整 URL（无图回退渐变占位）
      service.coverUrl = format.coverUrl(service.cover)
      this.setData({ service: service, selectedIndex: 0, quantity: 1, showRules: false })
      this.calcTotal()
    }).catch(() => {
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(function () {
        wx.navigateBack()
      }, 1500)
    })
  },

  // 重算合计：specs[selectedIndex].price * quantity
  calcTotal() {
    const service = this.data.service
    if (!service || !service.specs || !service.specs.length) return
    const spec = service.specs[this.data.selectedIndex]
    const total = spec.price * this.data.quantity
    this.setData({ total: total, totalText: format.fenToYuan(total) })
  },

  onSpecTap(e) {
    const index = Number(e.currentTarget.dataset.index)
    if (index === this.data.selectedIndex) return
    this.setData({ selectedIndex: index })
    this.calcTotal()
  },

  onQuantityChange(e) {
    this.setData({ quantity: e.detail.value })
    this.calcTotal()
  },

  onToggleRules() {
    this.setData({ showRules: !this.data.showRules })
  },

  onCopyWechat() {
    wx.makePhoneCall({
      phoneNumber: config.customerServicePhone,
      fail: function () {}
    })
  },

  onOrder() {
    const service = this.data.service
    if (!service) return
    if (!auth.requireLogin()) return
    const spec = service.specs[this.data.selectedIndex]
    const url = '/pages/order-confirm/order-confirm?serviceId=' +
      encodeURIComponent(service.id) +
      '&specValue=' + encodeURIComponent(String(spec.value)) +
      '&quantity=' + this.data.quantity
    wx.navigateTo({ url: url })
  }
})
