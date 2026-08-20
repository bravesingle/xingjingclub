// utils/auth.js
// 登录态管理（token + 用户信息本地持久化）
const TOKEN_KEY = 'xjes_token'
const USER_KEY = 'xjes_user'

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || ''
}

function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token)
}

function getUserInfo() {
  return wx.getStorageSync(USER_KEY) || null
}

function setUserInfo(userInfo) {
  wx.setStorageSync(USER_KEY, userInfo)
}

function clearSession() {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
}

function isLoggedIn() {
  return !!getToken()
}

/** 保存登录态（同步 globalData） */
function saveSession(token, userInfo) {
  setToken(token)
  setUserInfo(userInfo)
  const app = getApp()
  if (app) {
    app.globalData.token = token
    app.globalData.userInfo = userInfo
  }
}

/** 未登录则跳转登录页并返回 false；已登录返回 true */
function requireLogin() {
  if (isLoggedIn()) return true
  wx.navigateTo({ url: '/pages/login/login' })
  return false
}

module.exports = {
  getToken,
  setToken,
  getUserInfo,
  setUserInfo,
  clearSession,
  isLoggedIn,
  saveSession,
  requireLogin
}
