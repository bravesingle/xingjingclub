// admin/src/api/upload.js
// 图片上传（对接后端 /admin/upload/image）
import axios from 'axios'
import { API_BASE, getToken } from './base'

export function uploadImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  return axios
    .post(API_BASE + '/admin/upload/image', fd, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: 'Bearer ' + getToken()
      }
    })
    .then((res) => {
      const body = res.data
      if (body && body.code === 0) return body.data
      throw new Error((body && body.msg) || '上传失败')
    })
}
