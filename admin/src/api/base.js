// admin/src/api/base.js
// HTTP 请求封装（对接后端 server/）+ 通用工具
// 契约：{ code, data, msg }，code 0 成功；401 自动清除登录态并跳登录页
import axios from 'axios'

export const API_BASE = 'http://127.0.0.1:3000/api'
const TOKEN_KEY = 'xjes_admin_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

const http = axios.create({ baseURL: API_BASE, timeout: 15000 })

http.interceptors.request.use((cfg) => {
  const token = getToken()
  if (token) cfg.headers.Authorization = 'Bearer ' + token
  return cfg
})

http.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && body.code === 0) return body.data
    if (body && body.code === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.hash = '#/login'
    }
    throw new Error((body && body.msg) || '请求失败')
  },
  (err) => {
    const body = err.response && err.response.data
    if (body && body.code === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.hash = '#/login'
    }
    throw new Error((body && body.msg) || err.message || '网络异常')
  }
)

export function get(url, params) {
  return http.get(url, { params })
}
export function post(url, data) {
  return http.post(url, data)
}
export function put(url, data) {
  return http.put(url, data)
}
export function patch(url, data) {
  return http.patch(url, data)
}
export function del(url) {
  return http.delete(url)
}

/* ============ 通用工具（保留供页面使用） ============ */

/** 金额：分 -> 元字符串 */
export function fenToYuan(fen) {
  if (fen === null || fen === undefined || isNaN(fen)) return '0.00'
  fen = Number(fen)
  const sign = fen < 0 ? '-' : ''
  fen = Math.abs(fen)
  const pad = (n) => (n < 10 ? '0' + n : '' + n)
  return sign + Math.floor(fen / 100) + '.' + pad(Math.floor(fen % 100))
}

/** 时间戳 -> YYYY-MM-DD HH:mm */
export function formatTime(ts, pattern) {
  if (!ts) return '-'
  const d = new Date(ts)
  const map = {
    YYYY: d.getFullYear(),
    MM: pad2(d.getMonth() + 1),
    DD: pad2(d.getDate()),
    HH: pad2(d.getHours()),
    mm: pad2(d.getMinutes()),
    ss: pad2(d.getSeconds())
  }
  return (pattern || 'YYYY-MM-DD HH:mm').replace(/YYYY|MM|DD|HH|mm|ss/g, (k) => map[k])
}

function pad2(n) {
  return n < 10 ? '0' + n : '' + n
}
