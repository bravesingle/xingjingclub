// admin/src/api/booster.js
// 打手管理（对接后端 /admin/boosters）
import { get, post, patch as httpPatch, del } from './base'

export const AUDIT_MAP = {
  pending: { text: '待审核', type: 'warning' },
  approved: { text: '已通过', type: 'success' },
  rejected: { text: '已驳回', type: 'danger' }
}

export function listBoosters(params = {}) {
  return get('/admin/boosters', {
    page: 1,
    pageSize: 200,
    status: params.status && params.status !== 'all' ? params.status : '',
    keyword: params.keyword || ''
  }).then((r) => r.list)
}

export function addBooster(payload) {
  return post('/admin/boosters', payload)
}

/**
 * 更新打手：audit('approve'|'reject' 便捷指令或 'pending'/'approved'/'rejected')
 *           online(bool) | accepting(bool) | rank/rating/remark
 * 前端便捷指令 'approve'/'reject' 映射为后端枚举值
 * 注意：参数名不能叫 patch，会遮蔽 import 的 patch 函数
 */
export function updateBooster(id, payload) {
  const p = { ...payload }
  if (p.audit === 'approve') p.audit = 'approved'
  else if (p.audit === 'reject') p.audit = 'rejected'
  return httpPatch('/admin/boosters/' + id, p)
}

export function removeBooster(id) {
  return del('/admin/boosters/' + id)
}

export function batchRemoveBoosters(ids) {
  return post('/admin/boosters/batch-delete', { ids })
}
