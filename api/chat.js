// api/chat.js
// 订单聊天：历史记录 + WebSocket 实时消息
const request = require('../utils/request')
const auth = require('../utils/auth')
const config = require('../config/index')

/** 聊天历史 */
function getHistory(orderId) {
  return request.get('/chat/' + orderId + '/history')
}

/**
 * 连接订单聊天 WebSocket
 * 返回对象 { send, close }，通过回调接收事件
 * 事件：authOk() / message(msg) / error(msg) / close()
 */
function connectChat(orderId, handlers) {
  const token = auth.getToken()
  const socket = wx.connectSocket({ url: config.wsUrl[config.env] })
  let authed = false

  socket.onOpen(function () {
    socket.send({
      data: JSON.stringify({ event: 'auth', data: { token: token, orderId: orderId } })
    })
  })

  socket.onMessage(function (res) {
    let m
    try {
      m = JSON.parse(res.data)
    } catch (e) {
      return
    }
    if (m.event === 'auth_ok') {
      authed = true
      if (handlers.authOk) handlers.authOk()
    } else if (m.event === 'message') {
      if (handlers.message) handlers.message(m.data)
    } else if (m.event === 'error') {
      if (handlers.error) handlers.error((m.data && m.data.msg) || '聊天连接失败')
    }
  })

  socket.onError(function () {
    if (handlers.error) handlers.error('聊天连接异常')
  })

  socket.onClose(function () {
    if (handlers.close) handlers.close()
  })

  return {
    send: function (content) {
      if (!authed || !content) return
      socket.send({
        data: JSON.stringify({ event: 'message', data: { content: content, type: 'text' } })
      })
    },
    close: function () {
      socket.close()
    }
  }
}

module.exports = {
  getHistory: getHistory,
  connectChat: connectChat
}
