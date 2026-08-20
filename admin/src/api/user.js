// admin/src/api/user.js
// 用户管理（对接后端 /admin/users）
import { get, post, patch, del } from './base'

export function listUsers(params = {}) {
  return get('/admin/users', {
    page: 1,
    pageSize: 200,
    keyword: params.keyword || ''
  }).then((r) => r.list)
}

export function toggleBan(id) {
  return patch('/admin/users/' + id + '/ban')
}

export function removeUser(id) {
  return del('/admin/users/' + id)
}

export function batchRemoveUsers(ids) {
  return post('/admin/users/batch-delete', { ids })
}

export function addUser(payload) {
  return post('/admin/users', payload)
}
