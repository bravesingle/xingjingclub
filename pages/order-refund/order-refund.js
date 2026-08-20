// pages/order-refund/order-refund.js
// 申请退款：退款金额 + 原因单选 + 补充说明 + 提交申请
const orderApi = require('../../api/order')
const format = require('../../utils/format')

Page({
  data: {
    orderId: '',
    order: null,
    amountText: '0.00',
    reasons: ['服务不满意', '下单信息填写错误', '重复下单', '服务未开始', '其他'],
    selectedReason: '',
    detail: '',
    submitting: false
  },

  onLoad(options) {
    const orderId = decodeURIComponent(options.orderId || '')
    this.setData({ orderId: orderId })
    this.load()
  },

  load() {
    orderApi.getOrderDetail(this.data.orderId).then((order) => {
      if (!order) {
        wx.showToast({ title: '订单不存在', icon: 'none' })
        return
      }
      this.setData({
        order: order,
        amountText: format.fenToYuan(order.amount)
      })
    }).catch(() => {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    })
  },

  onReasonTap(e) {
    this.setData({ selectedReason: e.currentTarget.dataset.reason })
  },

  onDetailInput(e) {
    this.setData({ detail: e.detail.value })
  },

  onSubmit() {
    if (this.data.submitting) return
    if (!this.data.selectedReason) {
      wx.showToast({ title: '请选择退款原因', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    orderApi.applyRefund(this.data.orderId, {
      reason: this.data.selectedReason,
      detail: this.data.detail
    }).then(() => {
      wx.showToast({ title: '退款申请已提交', icon: 'success' })
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/order-detail/order-detail?id=' + encodeURIComponent(this.data.orderId)
        })
      }, 600)
    }).catch(() => {
      wx.showToast({ title: '提交失败，请重试', icon: 'none' })
      this.setData({ submitting: false })
    })
  }
})
