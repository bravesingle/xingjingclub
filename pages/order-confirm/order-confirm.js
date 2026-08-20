// pages/order-confirm/order-confirm.js
// 确认订单：服务规格选择 -> 数量 -> 留言 -> 价格明细 -> 提交下单
const serviceApi = require('../../api/service')
const orderApi = require('../../api/order')
const auth = require('../../utils/auth')
const format = require('../../utils/format')

Page({
  data: {
    service: null,
    spec: null,
    quantity: 1,
    total: 0,
    totalText: '0.00',
    unitPriceText: '0.00',
    remark: '',
    contact: '',
    submitting: false
  },

  onLoad(options) {
    const serviceId = decodeURIComponent(options.serviceId || '')
    const specValue = decodeURIComponent(options.specValue || '')
    const quantity = Number(decodeURIComponent(options.quantity || '1')) || 1
    this.setData({ quantity: quantity })
    this.loadService(serviceId, specValue)
  },

  loadService(serviceId, specValue) {
    serviceApi.getServiceDetail(serviceId).then((service) => {
      if (!service) {
        wx.showToast({ title: '服务不存在', icon: 'none' })
        setTimeout(function () { wx.navigateBack() }, 800)
        return
      }
      let spec = null
      const sv = Number(specValue)
      for (let i = 0; i < service.specs.length; i++) {
        if (service.specs[i].value === sv) {
          spec = service.specs[i]
          break
        }
      }
      if (!spec) spec = service.specs[0]
      this.setData({
        service: service,
        spec: spec,
        unitPriceText: format.fenToYuan(spec.price)
      })
      this.updateTotal()
    }).catch(() => {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    })
  },

  onQuantityChange(e) {
    this.setData({ quantity: e.detail.value })
    this.updateTotal()
  },

  updateTotal() {
    const spec = this.data.spec
    if (!spec) return
    const total = spec.price * this.data.quantity
    this.setData({ total: total, totalText: format.fenToYuan(total) })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  onSubmit() {
    if (this.data.submitting) return
    if (!auth.requireLogin()) return
    const spec = this.data.spec
    if (!this.data.service || !spec) {
      wx.showToast({ title: '订单信息不完整', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    orderApi.createOrder({
      serviceId: this.data.service.id,
      specValue: spec.value,
      quantity: this.data.quantity,
      remark: this.data.remark,
      contact: this.data.contact
    }).then((order) => {
      wx.redirectTo({
        url: '/pages/order-pay/order-pay?orderId=' + encodeURIComponent(order.id)
      })
    }).catch(() => {
      wx.showToast({ title: '提交失败，请重试', icon: 'none' })
      this.setData({ submitting: false })
    })
  }
})
