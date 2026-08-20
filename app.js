// app.js
// 星竞电竞 · 三角洲行动陪玩小程序 全局入口
const auth = require('./utils/auth')

App({
  globalData: {
    userInfo: null,
    token: '',
    // 无后端阶段：mock 订单数据存放处（内存态，重启后回到种子数据）
    mockOrders: []
  },

  onLaunch() {
    const token = auth.getToken()
    if (token) {
      this.globalData.token = token
      this.globalData.userInfo = auth.getUserInfo()
    }
  }
})
