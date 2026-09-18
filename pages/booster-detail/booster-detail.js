// pages/booster-detail/booster-detail.js
const boosterApi = require('../../api/booster')
const format = require('../../utils/format')

Page({
  data: {
    id: '',
    booster: null,
    loading: true
  },

  onLoad(options) {
    const id = decodeURIComponent(options.id || '')
    this.setData({ id: id })
    this.load()
  },

  load() {
    if (!this.data.id) return
    this.setData({ loading: true })
    boosterApi.getBoosterDetail(this.data.id).then((booster) => {
      const categoryText = (booster.categoryNames || []).join(' / ') || '综合服务'
      const joinedText = booster.joinedAt ? format.formatTime(booster.joinedAt, 'YYYY-MM-DD') : '-'
      const avatarText = (booster.displayName || booster.name || '星').charAt(0)
      this.setData({
        booster: Object.assign({}, booster, {
          categoryText: categoryText,
          joinedText: joinedText,
          avatarText: avatarText,
          statusText: booster.accepting ? '可接单' : '在线',
          rankText: booster.rank || '未设置段位',
          orderCountText: booster.orderCount || 0,
          playerNameText: booster.playerNickname || booster.name || '-',
          gameIdText: booster.gameId || '-',
          remarkText: booster.remark || '这个打手还没有填写简介。'
        }),
        loading: false
      })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  onGoServices() {
    wx.navigateTo({ url: '/pages/service-list/service-list?category=all' })
  },

  onBack() {
    wx.navigateBack()
  }
})
