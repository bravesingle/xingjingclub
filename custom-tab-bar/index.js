// custom-tab-bar/index.js
// 自定义底部导航：按角色切换
// 玩家: 首页 / 订单 / 我的
// 服务方: 工作台 / 消息 / 我的
const auth = require('../utils/auth')

const PLAYER_TABS = [
  { pagePath: '/pages/index/index', text: '首页', icon: '🏠' },
  { pagePath: '/pages/order-list/order-list', text: '订单', icon: '📋' },
  { pagePath: '/pages/user/user', text: '我的', icon: '👤' }
]

const BOOSTER_TABS = [
  { pagePath: '/pages/booster-work/booster-work', text: '工作台', icon: '⚔️' },
  { pagePath: '/pages/booster-chat/booster-chat', text: '消息', icon: '💬' },
  { pagePath: '/pages/user/user', text: '我的', icon: '👤' }
]

Component({
  data: {
    selected: 0,
    role: 'player',
    list: PLAYER_TABS
  },
  lifetimes: {
    attached() {
      this.refresh()
    }
  },
  methods: {
    /** 根据当前登录角色刷新 tab 列表 */
    refresh() {
      const userInfo = auth.getUserInfo()
      const role = userInfo && userInfo.role === 'booster' ? 'booster' : 'player'
      const list = role === 'booster' ? BOOSTER_TABS : PLAYER_TABS
      this.setData({ role: role, list: list })
    },
    onTabTap(e) {
      const index = e.currentTarget.dataset.index
      const path = this.data.list[index].pagePath
      if (index === this.data.selected) return
      wx.switchTab({ url: path })
    }
  }
})
