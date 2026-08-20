// config/index.js
// 全局环境配置
module.exports = {
  // 品牌信息
  brand: '星竞电竞',
  brandSlogan: '大神陪玩 · 稳定上分',
  gameName: '三角洲行动',

  // 环境: dev | prod
  env: 'dev',

  // 后端接口地址（baseUrl 需带 /api 前缀，与后端全局前缀一致；上线需 https 域名）
  baseUrl: {
    dev: 'http://127.0.0.1:3000/api',
    prod: 'https://api.xingjingesports.com/api'
  },

  // WebSocket 聊天地址（小程序 wx.connectSocket）
  wsUrl: {
    dev: 'ws://127.0.0.1:3000/chat',
    prod: 'wss://api.xingjingesports.com/chat'
  },

  // 是否使用本地 mock 数据（false = 对接真实后端 server/）
  // 注意：本地 http 联调需在微信开发者工具勾选「不校验合法域名」
  useMock: false,

  // 开发期匿名登录：true 时用本地持久化匿名ID模拟微信身份（同一设备恒为同一用户），
  // 对应后端 WECHAT_MOCK=true；配置真实微信 appid/secret 后改为 false（走 wx.login code）
  anonLogin: true,

  // 开发阶段使用模拟支付（true 时收银台调后端 /pay/mock，不拉起微信支付）
  useMockPay: true,

  // 订单支付时限（分钟），超时自动取消
  payTimeoutMinutes: 15,

  // 客服微信（占位，上线前替换）
  customerServiceWechat: 'XJES-KF',

  // 版本
  version: '1.0.0'
}
