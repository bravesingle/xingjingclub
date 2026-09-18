// admin/src/api/service.js
// 服务商品管理（对接后端 /admin/services）
import { get, post, put, patch, del } from './base'

export function listServices() {
  return get('/admin/services', { page: 1, pageSize: 200 }).then((r) => r.list)
}

export function createService(payload) {
  return post('/admin/services', payload)
}

export function updateService(id, patch) {
  return put('/admin/services/' + id, patch)
}

export function toggleService(id) {
  return patch('/admin/services/' + id + '/toggle')
}

export function removeService(id) {
  return del('/admin/services/' + id)
}

export function batchRemoveServices(ids) {
  return post('/admin/services/batch-delete', { ids })
}

/** 服务分类常量（供表单下拉使用） */
export const CATEGORY_OPTIONS = [
  { value: 'rank', label: '排位' },
  { value: 'loot', label: '摸金' },
  { value: 'task', label: '任务通关' },
  { value: 'warfare', label: '全面战场' }
]

export const MODE_OPTIONS = [
  { value: 'hazard', label: '烽火地带' },
  { value: 'warfare', label: '全面战场' }
]
