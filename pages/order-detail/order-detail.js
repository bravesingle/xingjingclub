// pages/order-detail/order-detail.js
// 订单详情：状态头部 + 倒计时 + 服务信息 + 订单信息 + 状态操作（玩家/打手不同视角）
const orderApi = require('../../api/order')
const auth = require('../../utils/auth')
const config = require('../../config/index')
const format = require('../../utils/format')

// 各状态描述文案
const STATUS_DESC = {
  pending_pay: '请尽快完成支付，超时将自动取消',
  paid: '已支付，等待客服安排服务',
  in_progress: '陪玩服务进行中',
  completed: '订单已完成，感谢使用',
  cancelled: '订单已取消',
  refunding: '退款申请处理中',
  refunded: '退款已完成'
}

Page({
  data: {
    orderId: '',
    order: null,
    statusInfo: { text: '', cls: '' },
    statusDesc: '',
    amountText: '0.00',
    createdAtText: '',
    paidAtText: '',
    isBooster: false
  },

  onLoad(options) {
    const orderId = decodeURIComponent(options.id || options.orderId || '')
    // 打手视角：只显示信息 + 进入聊天，不显示玩家操作按钮
    const userInfo = auth.getUserInfo()
    this.setData({
      orderId: orderId,
      isBooster: !!(userInfo && userInfo.role === 'booster')
    })
    this.load()
  },

  /** 打手进入聊天 */
  onGoChat() {
    wx.navigateTo({
      url: '/pages/chat/chat?orderId=' + encodeURIComponent(this.data.orderId)
    })
  },

  load() {
    orderApi.getOrderDetail(this.data.orderId).then((order) => {
      if (!order) {
        wx.showToast({ title: '订单不存在', icon: 'none' })
        return
      }
      const st = format.orderStatus(order.status)
      this.setData({
        order: order,
        statusInfo: st,
        statusDesc: STATUS_DESC[order.status] || '',
        amountText: format.fenToYuan(order.amount),
        createdAtText: format.formatTime(order.createdAt),
        paidAtText: order.paidAt ? format.formatTime(order.paidAt) : ''
      })
    }).catch(() => {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    })
  },

  onCountdownFinish() {
    wx.showToast({ title: '订单已超时，已自动取消', icon: 'none' })
    this.load()
  },

  onCancelOrder() {
    wx.showModal({
      title: '取消订单',
      content: '取消后如需服务需重新下单，确定取消？',
      success: (res) => {
        if (!res.confirm) return
        orderApi.cancelOrder(this.data.orderId).then(() => {
          wx.showToast({ title: '订单已取消', icon: 'success' })
          this.load()
        }).catch(() => {
          wx.showToast({ title: '取消失败，请重试', icon: 'none' })
        })
      }
    })
  },

  onGoPay() {
    wx.redirectTo({
      url: '/pages/order-pay/order-pay?orderId=' + encodeURIComponent(this.data.orderId)
    })
  },

  onRefund() {
    wx.navigateTo({
      url: '/pages/order-refund/order-refund?orderId=' + encodeURIComponent(this.data.orderId)
    })
  },

  onComplete() {
    wx.showModal({
      title: '确认完成',
      content: '确认本次陪玩服务已完成？',
      success: (res) => {
        if (!res.confirm) return
        orderApi.completeOrder(this.data.orderId).then(() => {
          wx.showToast({ title: '服务已完成', icon: 'success' })
          this.load()
        }).catch(() => {
          wx.showToast({ title: '操作失败，请重试', icon: 'none' })
        })
      }
    })
  },

  onAgain() {
    const order = this.data.order
    if (!order) return
    wx.navigateTo({
      url: '/pages/service-detail/service-detail?id=' + encodeURIComponent(order.serviceId)
    })
  },

  onContact() {
    wx.setClipboardData({
      data: config.customerServiceWechat,
      success: () => {
        wx.showToast({ title: '客服微信已复制', icon: 'none' })
      }
    })
  }
})
