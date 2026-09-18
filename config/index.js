// config/index.js
// 全局环境配置
module.exports = {
  // 品牌信息
  brand: '星竞电竞',
  brandSlogan: '大神组队 · 快乐开黑',
  gameName: '三角洲行动',

  // 环境: dev | prod
  env: 'prod',  // ★上线设 'prod'★

  // =============================================================================
  // ▼ 上线链路（真实资源）：
  //   - dev.baseUrl / dev.wsUrl = 本机 SSH 隧道 → 服务器后端（联调用，勾「不校验合法域名」）
  //     ★但小程序【正式版】只能连 HTTPS+wss 的已备案域名，不能连裸 IP 的 http；
  //     ★所以正式发布走 prod，不走 dev。
  //   - prod: 生产域名使用主域名 xingjingclub.cn（已备案 + HTTPS 证书 + Nginx 均就绪，
  //     服务器实测 https://xingjingclub.cn/api/home/data 返回 200）。
  //     /chat 的 WebSocket 升级头在 Nginx 已配置，wss://xingjingclub.cn/chat 可用。
  //   联调隧道：MobaXterm SSH 隧道 3000 → 服务器 127.0.0.1:3000
  // =============================================================================
  baseUrl: {
    dev: 'http://127.0.0.1:3000/api',                                            // SSH隧道联调（勾「不校验合法域名」）
    prod: 'https://xingjingclub.cn/api'                                          // 生产 API 域名（已备案+HTTPS+Nginx 就绪）
  },

  // WebSocket 聊天地址（小程序 wx.connectSocket；生产必须 wss://）
  wsUrl: {
    dev: 'ws://127.0.0.1:3000/chat',                                             // SSH隧道联调（勾「不校验合法域名」）
    prod: 'wss://xingjingclub.cn/chat'                                           // 生产 socket 域名；与 baseUrl 同一域名同一证书
  },

  // 是否使用本地 mock 数据（false = 对接真实后端 server/）
  // 注意：本地 http 联调需在微信开发者工具勾选「不校验合法域名」
  useMock: false,

  // 微信登录：false = 走真实 wx.login code（对应后端 WECHAT_MOCK=false）★联调/上线均用 false★
  anonLogin: false,

  // 支付：false = 真实微信支付（对应后端 PAY_MOCK=false）★联调/上线均用 false★
  // 注意：发起真实下单前确保后端已配好 WXPAY_* 且 AppID 已绑定商户
  useMockPay: false,

  // 订单支付时限（分钟），超时自动取消
  payTimeoutMinutes: 15,

  // 客服电话（点击唤起系统拨号，合规且无导流风险）
  customerServicePhone: '17706977125',

  // 版本
  version: '1.0.0'
}
