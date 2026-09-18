// pages/chat/chat.js
// 订单聊天页（玩家 / 服务方共用）
const chatApi = require('../../api/chat')
const auth = require('../../utils/auth')

Page({
  data: {
    orderId: 0,
    messages: [],
    inputText: '',
    myId: 0,
    sending: false,
    connected: false
  },

  onLoad(options) {
    const orderId = Number(decodeURIComponent(options.orderId || '0'))
    const userInfo = auth.getUserInfo()
    this.setData({ orderId: orderId, myId: (userInfo && userInfo.id) || 0 })
    this.loadHistory()
    this.connect()
  },

  onUnload() {
    if (this.chat) this.chat.close()
  },

  loadHistory() {
    chatApi.getHistory(this.data.orderId).then(function (res) {
      const list = (res && res.list) || []
      this.setData({ messages: list.map(function (m) { return this.decorate(m) }, this) })
      this.scrollBottom()
    }.bind(this)).catch(function () {})
  },

  connect() {
    const that = this
    this.chat = chatApi.connectChat(this.data.orderId, {
      authOk: function () {
        that.setData({ connected: true })
      },
      message: function (msg) {
        const messages = that.data.messages.concat([that.decorate(msg)])
        that.setData({ messages: messages })
        that.scrollBottom()
      },
      error: function (msg) {
        wx.showToast({ title: msg, icon: 'none' })
      }
    })
  },

  decorate(msg) {
    const mine = msg.senderId === this.data.myId
    return {
      id: msg.id,
      content: msg.content,
      senderRole: msg.senderRole,
      mine: mine,
      time: this.formatTime(msg.sentAt)
    }
  },

  formatTime(ts) {
    if (ts === null || ts === undefined || ts === '') return ''
    const n = Number(ts)
    if (isNaN(n) || n <= 0) return ''
    const d = new Date(n)
    if (isNaN(d.getTime())) return ''
    const pad = function (x) { return x < 10 ? '0' + x : '' + x }
    return pad(d.getHours()) + ':' + pad(d.getMinutes())
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  onSend() {
    const text = this.data.inputText.trim()
    if (!text || this.data.sending) return
    if (!this.data.connected) {
      wx.showToast({ title: '连接中，请稍后', icon: 'none' })
      return
    }
    this.chat.send(text)
    this.setData({ inputText: '' })
  },

  scrollBottom() {
    // 简单滚动到底（用 page-meta 或 scroll-view，这里用 wx.createSelectorQuery 简化处理）
    const that = this
    wx.nextTick(function () {
      wx.createSelectorQuery().in(that).select('#msg-list').boundingClientRect(function (rect) {
        if (rect) {
          wx.pageScrollTo({ scrollTop: rect.height + 1000, duration: 200 })
        }
      }).exec()
    })
  }
})
