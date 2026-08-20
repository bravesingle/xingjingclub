// utils/format.js
// 通用格式化工具

function pad(n) {
  n = Number(n)
  return n < 10 ? '0' + n : '' + n
}

/** 分 -> 元字符串，如 2500 -> "25.00" */
function fenToYuan(fen) {
  if (fen === null || fen === undefined || isNaN(fen)) return '0.00'
  fen = Number(fen)
  const sign = fen < 0 ? '-' : ''
  fen = Math.abs(fen)
  return sign + Math.floor(fen / 100) + '.' + pad(Math.floor(fen % 100))
}

/** 时间戳 -> 字符串，pattern 支持 YYYY MM DD HH mm ss */
function formatTime(ts, pattern) {
  if (!ts) return ''
  const d = new Date(ts)
  const map = {
    YYYY: d.getFullYear(),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds())
  }
  return (pattern || 'YYYY-MM-DD HH:mm').replace(/YYYY|MM|DD|HH|mm|ss/g, function (k) {
    return map[k]
  })
}

/** 订单状态 -> { text, cls }，cls 对应 app.wxss 中 .st-* 徽标类 */
const ORDER_STATUS_MAP = {
  pending_pay: { text: '待支付', cls: 'st-pending' },
  paid: { text: '已支付', cls: 'st-paid' },
  in_progress: { text: '服务中', cls: 'st-in_progress' },
  completed: { text: '已完成', cls: 'st-completed' },
  cancelled: { text: '已取消', cls: 'st-cancelled' },
  refunding: { text: '退款中', cls: 'st-refunding' },
  refunded: { text: '已退款', cls: 'st-refunded' }
}

function orderStatus(status) {
  return ORDER_STATUS_MAP[status] || { text: status || '未知', cls: '' }
}

module.exports = {
  pad,
  fenToYuan,
  formatTime,
  orderStatus
}
