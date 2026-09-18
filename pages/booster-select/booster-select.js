// pages/booster-select/booster-select.js
// 玩家端选人：搜索昵称/ID/游戏ID，展示已上线打手列表
const boosterApi = require('../../api/booster')
const format = require('../../utils/format')

Page({
  data: {
    keyword: '',
    list: [],
    loading: true
  },

  onLoad() {
    this.load()
  },

  onPullDownRefresh() {
    this.load().then(() => {
      wx.stopPullDownRefresh()
    }).catch(() => {
      wx.stopPullDownRefresh()
    })
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.load()
  },

  onClearSearch() {
    if (!this.data.keyword) return
    this.setData({ keyword: '' })
    this.load('')
  },

  load(keyword) {
    const kw = keyword !== undefined ? keyword : this.data.keyword
    this.setData({ loading: true })
    return boosterApi.getBoosters((kw || '').trim()).then((list) => {
      this.setData({
        list: this.decorate(list || []),
        loading: false
      })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  decorate(list) {
    return list.map(function (item) {
      const joinedText = item.joinedAt ? format.formatTime(item.joinedAt, 'YYYY-MM-DD') : ''
      const avatarText = (item.displayName || item.name || '星').charAt(0)
      return Object.assign({}, item, {
        avatarText: avatarText,
        joinedText: joinedText,
        rankText: item.rank || '未设置段位',
        orderCountText: item.orderCount || 0,
        remarkText: item.remark || '暂无简介，点进查看详细资料',
        categoryText: (item.categoryNames || []).join(' / ') || '综合服务',
        statusText: item.accepting ? '可接单' : '在线',
        statusCls: item.accepting ? 'status-ready' : 'status-online'
      })
    })
  },

  onGoDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: '/pages/booster-detail/booster-detail?id=' + encodeURIComponent(id)
    })
  }
})
