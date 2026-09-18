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
      if (!s) return
      const patch = {}
      if (s.specs && s.specs.length) {
        patch.priceText = format.fenToYuan(s.specs[0].price)
      }
      // 封面图片：相对路径转完整 URL（无图时为空，WXML 回退渐变占位）
      patch.coverUrl = format.coverUrl(s.cover)
      this.setData(patch)
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
