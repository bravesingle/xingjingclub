// admin/src/api/banner.js
// 首页 Banner 管理（对接后端 /admin/banners）
import { get, post, del } from './base'

export function listBanners() {
  return get('/admin/banners')
}

export function createBanner(data) {
  return post('/admin/banners', data)
}

export function removeBanner(id) {
  return del('/admin/banners/' + id)
}
