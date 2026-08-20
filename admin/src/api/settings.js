// admin/src/api/settings.js
// 系统设置（对接后端 /admin/settings）
import { get, post, put } from './base'

export function getSettings() {
  return get('/admin/settings')
}

export function updateSettings(patch) {
  return put('/admin/settings', patch)
}

export function resetAllData() {
  return post('/admin/settings/reset')
}
