// api/service.js
// 陪玩服务商品接口
// 后端契约：GET /home/data、GET /services?category=&mode=&keyword=&sort=&page=&pageSize= 返回 { list, total }
const request = require('../utils/request')
const mock = require('../mock/index')
const config = require('../config/index')

function useMock() {
  return config.useMock
}

/** 首页聚合数据：banner + 分类 + 热门服务 */
function getHomeData() {
  if (useMock()) return Promise.resolve(mock.getHomeData())
  return request.get('/home/data')
}

/** 服务列表：{ category, mode, keyword, sort } → 返回数组（后端分页取第一页全部） */
function getServiceList(params) {
  if (useMock()) return Promise.resolve(mock.getServiceList(params || {}))
  return request
    .get('/services', Object.assign({ page: 1, pageSize: 50 }, params || {}))
    .then(function (res) {
      return (res && res.list) || []
    })
}

/** 服务详情 */
function getServiceDetail(id) {
  if (useMock()) return Promise.resolve(mock.getServiceById(id))
  return request.get('/services/' + id)
}

module.exports = {
  getHomeData: getHomeData,
  getServiceList: getServiceList,
  getServiceDetail: getServiceDetail
}
