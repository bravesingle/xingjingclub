// utils/format.js
// 通用格式化工具
const config = require('../config/index')

function pad(n) {
  n = Number(n)
  return n < 10 ? '0' + n : '' + n
}

/**
 * 图片相对路径（如 /uploads/img-xxx.png）→ 完整 URL（按当前环境 baseUrl 拼 origin）
 * 绝对 URL（http/https 开头）原样返回；空值返回 ''
 * 例：dev 环境 "/uploads/a.png" → "http://127.0.0.1:3000/uploads/a.png"
 */
function coverUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  const base = (config.baseUrl && config.baseUrl[config.env]) || ''
  const origin = base.replace(/\/api\/?$/, '')
  return origin + path
}

/** 分 -> 元字符串，如 2500 -> "25.00" */
function fenToYuan(fen) {
  if (fen === null || fen === undefined || isNaN(fen)) return '0.00'
  fen = Number(fen)
  const sign = fen < 0 ? '-' : ''
  fen = Math.abs(fen)
  return sign + Math.floor(fen / 100) + '.' + pad(Math.floor(fen % 100))
}

/** 时间戳 -> 字符串，pattern 支持 YYYY MM DD HH mm ss；空值/非法返回 ''（不乱码） */
function formatTime(ts, pattern) {
  if (ts === null || ts === undefined || ts === '') return ''
  const n = Number(ts)
  if (isNaN(n) || n <= 0) return ''
  const d = new Date(n)
  if (isNaN(d.getTime())) return ''
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
  orderStatus,
  coverUrl
}
