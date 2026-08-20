// components/order-card/order-card.js
// 订单卡片：展示订单信息与状态操作
// 事件：detail(点击卡片) / pay / cancel / contact / again
const format = require('../../utils/format')

Component({
  properties: {
    order: { type: Object, value: {} }
  },
  data: {
    statusText: '',
    statusCls: '',
    amountText: '0.00'
  },
  observers: {
    order(o) {
      if (!o) return
      const st = format.orderStatus(o.status)
      this.setData({
        statusText: st.text,
        statusCls: st.cls,
        amountText: format.fenToYuan(o.amount)
      })
    }
  },
  methods: {
    onDetail() {
      const o = this.data.order
      if (!o || !o.id) return
      wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + o.id })
    },
    onPay() {
      this.triggerEvent('pay', { order: this.data.order })
    },
    onCancel() {
      this.triggerEvent('cancel', { order: this.data.order })
    },
    onContact() {
      this.triggerEvent('contact', { order: this.data.order })
    },
    onAgain() {
      this.triggerEvent('again', { order: this.data.order })
    }
  }
})
