// components/service-card/service-card.js
// 陪玩服务卡片：点击跳转服务详情
const format = require('../../utils/format')

Component({
  properties: {
    service: { type: Object, value: {} }
  },
  data: {
    priceText: '0.00'
  },
  observers: {
    service(s) {
      if (s && s.specs && s.specs.length) {
        this.setData({ priceText: format.fenToYuan(s.specs[0].price) })
      }
    }
  },
  methods: {
    onTap() {
      const s = this.data.service
      if (!s || !s.id) return
      wx.navigateTo({ url: '/pages/service-detail/service-detail?id=' + s.id })
    }
  }
})
