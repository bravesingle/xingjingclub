// components/empty/empty.js
// 通用空状态组件
Component({
  properties: {
    text: { type: String, value: '暂无数据' },
    subText: { type: String, value: '' },
    icon: { type: String, value: '📭' },
    btnText: { type: String, value: '' }
  },
  methods: {
    onAction() {
      this.triggerEvent('action')
    }
  }
})
