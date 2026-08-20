// mock/user.js
// 用户 Mock：登录生成用户信息，并持久化到本地缓存
const auth = require('../utils/auth')

/** 登录（模拟）：生成 token 与用户信息 */
function login(payload) {
  payload = payload || {}
  const nickname = (payload.nickname || '').trim() || '星竞玩家'
  const gameId = (payload.gameId || '').trim()
  const userInfo = {
    nickname: nickname,
    avatar: '',
    gameId: gameId,
    level: 1,
    vip: false,
    registeredAt: Date.now()
  }
  const token = 'mock_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  auth.saveSession(token, userInfo)
  return {
    token: token,
    userInfo: userInfo
  }
}

/** 获取当前用户信息 */
function getUser() {
  return auth.getUserInfo()
}

/** 更新用户信息 */
function updateUser(patch) {
  const cur = auth.getUserInfo() || {}
  const next = Object.assign({}, cur, patch || {})
  auth.setUserInfo(next)
  const app = getApp()
  if (app) app.globalData.userInfo = next
  return next
}

module.exports = {
  login: login,
  getUser: getUser,
  updateUser: updateUser
}
