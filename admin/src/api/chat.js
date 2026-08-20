// admin/src/api/chat.js
// 后台查看订单聊天记录（只读）
import { get } from './base'

export function getChatHistory(orderId) {
  return get('/admin/chat/' + orderId + '/history')
}
