// utils/request.js
// 网络请求统一封装：Promise + token 注入 + 统一错误提示
// 约定后端响应格式: { code: 0, data: ..., msg: '...' }，code 0 为成功
// 401 登录失效 / 403 账号封禁：清除本地登录态（避免登录页误判"已登录"造成死循环）并跳登录
const config = require('../config/index')
const auth = require('./auth')

/** 跳转登录页（已在登录页则跳过，避免重复压栈） */
function goLogin() {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  if (cur && cur.route === 'pages/login/login') return
  wx.navigateTo({ url: '/pages/login/login' })
}

function request(options) {
  return new Promise(function (resolve, reject) {
    const app = getApp()
    const header = { 'Content-Type': 'application/json' }
    if (app && app.globalData.token) {
      header.Authorization = 'Bearer ' + app.globalData.token
    }
    wx.request({
      url: config.baseUrl[config.env] + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: header,
      success(res) {
        const body = res.data
        if (body && body.code === 0) {
          resolve(body.data)
          return
        }
        if (body && (body.code === 401 || body.code === 403)) {
          // 401 登录过期 / 403 账号被封禁：必须清除本地登录态
          auth.clearSession()
          wx.showToast({ title: (body && body.msg) || '登录状态异常', icon: 'none' })
          setTimeout(goLogin, 600)
          reject(body)
          return
        }
        const msg = (body && body.msg) || '网络异常，请稍后重试'
        wx.showToast({ title: msg, icon: 'none' })
        reject(body || res)
      },
      fail(err) {
        wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
        reject(err)
      }
    })
  })
}

function get(url, data) {
  return request({ url: url, data: data })
}

function post(url, data) {
  return request({ url: url, data: data, method: 'POST' })
}

module.exports = {
  request: request,
  get: get,
  post: post
}
