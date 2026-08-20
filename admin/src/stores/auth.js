// admin/src/stores/auth.js
// 管理员登录态：对接后端 POST /admin/auth/login
import { reactive } from 'vue'
import { post } from '../api/base'

const TOKEN_KEY = 'xjes_admin_token'
const USER_KEY = 'xjes_admin_user'

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch (e) {
    return null
  }
}

export const authState = reactive({
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: readUser()
})

export function isLoggedIn() {
  return !!authState.token
}

/** 登录：调后端，成功保存 token/用户信息；返回 { ok, msg } */
export async function login(username, password) {
  try {
    const data = await post('/admin/auth/login', { username, password })
    authState.token = data.token
    authState.user = data.adminInfo
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.adminInfo))
    return { ok: true }
  } catch (e) {
    return { ok: false, msg: e.message || '登录失败' }
  }
}

export function logout() {
  authState.token = ''
  authState.user = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
