// api/user.js
// 用户接口（登录 / 信息 / 更新 / 退出）
// 后端契约：POST /auth/wechat-login { code, nickname, gameId } → { token, userInfo }
const request = require('../utils/request')
const mock = require('../mock/user')
const auth = require('../utils/auth')
const config = require('../config/index')

function useMock() {
  return config.useMock
}

const ANON_ID_KEY = 'xjes_anon_id'

/** 本地持久化匿名ID（开发期模拟微信身份：同一设备恒为同一用户） */
function getAnonId() {
  let id = wx.getStorageSync(ANON_ID_KEY)
  if (!id) {
    id = 'anon_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
    wx.setStorageSync(ANON_ID_KEY, id)
  }
  return id
}

/** 微信登录取身份标识：anonLogin=true 用匿名ID；否则 wx.login 拿 code */
function getWxCode() {
  return new Promise(function (resolve) {
    if (config.anonLogin) {
      resolve(getAnonId())
      return
    }
    if (typeof wx === 'undefined' || !wx.login) {
      resolve('anonymous')
      return
    }
    wx.login({
      success: function (res) {
        resolve((res && res.code) || 'anonymous')
      },
      fail: function () {
        resolve('anonymous')
      }
    })
  })
}

/**
 * 登录：{ nickname, gameId }
 * - mock：本地生成用户
 * - 真实：wx.login 拿 code → 后端换 openid/token，成功后本地保存登录态
 * 返回: { token, userInfo }
 */
async function login(payload) {
  if (useMock()) return Promise.resolve(mock.login(payload))
  const code = await getWxCode()
  const body = {
    code: code,
    nickname: (payload && payload.nickname) || '',
    gameId: (payload && payload.gameId) || ''
  }
  // 手机号绑定身份（开发期 mock 直接传；真实环境由 getPhoneNumber 换取）
  if (payload && payload.phone) body.phone = payload.phone
  const res = await request.post('/auth/wechat-login', body)
  // 保存登录态（与 mock 路径行为一致）
  if (res && res.token) {
    auth.saveSession(res.token, res.userInfo)
  }
  return res
}

/**
 * 微信一键登录：wx.login 拿 code + getPhoneNumber 授权 code → 后端换手机号并登录
 * @param payload { phoneCode, nickname?, gameId? }
 * 返回: { token, userInfo }
 */
async function phoneLogin(payload) {
  if (useMock()) return Promise.resolve(mock.login(payload))
  const code = await getWxCode()
  const res = await request.post('/auth/wechat-phone-login', {
    code: code,
    phoneCode: (payload && payload.phoneCode) || '',
    nickname: (payload && payload.nickname) || '',
    gameId: (payload && payload.gameId) || ''
  })
  if (res && res.token) {
    auth.saveSession(res.token, res.userInfo)
  }
  return res
}

/** 获取用户信息 */
function getUserInfo() {
  if (useMock()) return Promise.resolve(mock.getUser())
  return request.get('/user/info')
}

/** 更新用户信息 */
async function updateUserInfo(patch) {
  if (useMock()) return Promise.resolve(mock.updateUser(patch))
  const userInfo = await request.post('/user/info', patch)
  if (userInfo) {
    auth.setUserInfo(userInfo)
  }
  return userInfo
}

/** 退出登录（清除本地登录态 + 匿名ID，下次登录为全新身份） */
function logout() {
  auth.clearSession()
  // 清除匿名身份标识：退出后重新登录会生成新的 openid（全新用户），
  // 避免"换新ID登录"时因 openid 相同而覆盖旧用户；打手手机号登录仍按手机号锚定
  try {
    wx.removeStorageSync(ANON_ID_KEY)
  } catch (e) {}
  const app = getApp()
  if (app) {
    app.globalData.token = ''
    app.globalData.userInfo = null
  }
  return Promise.resolve({ ok: true })
}

module.exports = {
  login: login,
  phoneLogin: phoneLogin,
  getUserInfo: getUserInfo,
  updateUserInfo: updateUserInfo,
  logout: logout
}
