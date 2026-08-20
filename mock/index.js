// mock/index.js
// 首页与陪玩服务商品 Mock 数据
// 说明：
//  - 所有价格字段单位为「分」，展示时用 utils/format.fenToYuan 转换
//  - 服务规格按计价方式自动生成：按小时 / 按局，时长越长折扣越大
//  - coverGradient 为封面渐变占位（未接入图片 CDN 前使用）

const CONFIG = require('../config/index')

const BANNERS = [
  {
    id: 'b1',
    title: CONFIG.brand + ' · ' + CONFIG.gameName,
    subtitle: '大神陪玩 · 稳定上分',
    gradient: 'linear-gradient(135deg, #3A5BFF, #7B5CFF)'
  },
  {
    id: 'b2',
    title: '烽火地带 · 摸金带飞',
    subtitle: '高价值物资 · 保底撤离',
    gradient: 'linear-gradient(135deg, #FFA940, #FF5B6A)'
  },
  {
    id: 'b3',
    title: '新用户专享',
    subtitle: '首单立减 · 先到先得',
    gradient: 'linear-gradient(135deg, #2ECC71, #4D7CFF)'
  }
]

const CATEGORIES = [
  { id: 'rank', name: '排位上分', icon: '🏆', desc: '烽火地带排位' },
  { id: 'loot', name: '摸金带飞', icon: '💎', desc: '物资撤离' },
  { id: 'task', name: '任务通关', icon: '🎯', desc: '行动任务' },
  { id: 'warfare', name: '全面战场', icon: '⚔️', desc: '大战场' }
]

const COMMON_RULES = [
  '下单后请添加客服微信确认游戏区服与上线时间；',
  '陪玩过程中请保持语音沟通，便于带队指挥；',
  '如遇网络波动等不可抗力，服务时间顺延；',
  '请勿在任何场景使用外挂，违者概不负责。'
]

const COMMON_NOTICE = [
  '订单支付后不支持改单，请确认服务规格后下单；',
  '服务未开始前可申请全额退款；',
  '服务开始后按进度退款，详情咨询客服。'
]

// 原始服务数据（价格 = 起步价/单位）
const RAW_SERVICES = [
  {
    id: 's001',
    title: '烽火地带 · 排位上分',
    subtitle: '大神带队稳定冲分',
    category: 'rank',
    mode: 'hazard',
    modeName: '烽火地带',
    priceUnit: 'hour',
    unitName: '小时',
    basePrice: 3000,
    coverGradient: 'linear-gradient(135deg, #3A5BFF, #7B5CFF)',
    coverText: '排位上分',
    tags: ['高胜率', '语音带飞', '胜率保障'],
    sales: 2314,
    rating: 4.9
  },
  {
    id: 's002',
    title: '烽火地带 · 摸金带飞',
    subtitle: '高价值地图物资收割',
    category: 'loot',
    mode: 'hazard',
    modeName: '烽火地带',
    priceUnit: 'hour',
    unitName: '小时',
    basePrice: 3500,
    coverGradient: 'linear-gradient(135deg, #FFA940, #FF5B6A)',
    coverText: '摸金带飞',
    tags: ['物资满配', '保底撤离', '安全房区'],
    sales: 1876,
    rating: 4.8
  },
  {
    id: 's003',
    title: '烽火地带 · 任务通关',
    subtitle: '通行证任务一键搞定',
    category: 'task',
    mode: 'hazard',
    modeName: '烽火地带',
    priceUnit: 'hour',
    unitName: '小时',
    basePrice: 2000,
    coverGradient: 'linear-gradient(135deg, #2ECC71, #3A5BFF)',
    coverText: '任务通关',
    tags: ['任务全清', '效率极高', '随时开打'],
    sales: 965,
    rating: 4.9
  },
  {
    id: 's004',
    title: '全面战场 · 大战场陪玩',
    subtitle: '整活上分两不误',
    category: 'warfare',
    mode: 'warfare',
    modeName: '全面战场',
    priceUnit: 'match',
    unitName: '局',
    basePrice: 1500,
    coverGradient: 'linear-gradient(135deg, #FF5B6A, #7B5CFF)',
    coverText: '全面战场',
    tags: ['车队友好', '指挥到位', '稳定输出'],
    sales: 1520,
    rating: 4.7
  },
  {
    id: 's005',
    title: '烽火地带 · 排位保底套餐',
    subtitle: '承包段位稳定冲分',
    category: 'rank',
    mode: 'hazard',
    modeName: '烽火地带',
    priceUnit: 'hour',
    unitName: '小时',
    basePrice: 2800,
    coverGradient: 'linear-gradient(135deg, #3A5BFF, #2ECC71)',
    coverText: '保底套餐',
    tags: ['段位保底', '时长更优', '全程跟进'],
    sales: 732,
    rating: 4.9
  },
  {
    id: 's006',
    title: '全面战场 · 排位上分',
    subtitle: '大战场冲分利器',
    category: 'rank',
    mode: 'warfare',
    modeName: '全面战场',
    priceUnit: 'match',
    unitName: '局',
    basePrice: 1200,
    coverGradient: 'linear-gradient(135deg, #7B5CFF, #4D7CFF)',
    coverText: '战场冲分',
    tags: ['高胜率', '车队开黑'],
    sales: 1103,
    rating: 4.8
  },
  {
    id: 's007',
    title: '烽火地带 · 萌新教学',
    subtitle: '从零带你玩懂三角洲',
    category: 'task',
    mode: 'hazard',
    modeName: '烽火地带',
    priceUnit: 'hour',
    unitName: '小时',
    basePrice: 1800,
    coverGradient: 'linear-gradient(135deg, #2ECC71, #FFA940)',
    coverText: '萌新教学',
    tags: ['新手友好', '基础教学', '点位讲解'],
    sales: 645,
    rating: 5.0
  },
  {
    id: 's008',
    title: '烽火地带 · 车队满配',
    subtitle: '四排车队整装待发',
    category: 'loot',
    mode: 'hazard',
    modeName: '烽火地带',
    priceUnit: 'hour',
    unitName: '小时',
    basePrice: 4000,
    coverGradient: 'linear-gradient(135deg, #FFA940, #FFD34D)',
    coverText: '车队满配',
    tags: ['四排', '物资拉满', '稳定撤离'],
    sales: 498,
    rating: 4.9
  },
  {
    id: 's009',
    title: '全面战场 · 任务陪练',
    subtitle: '每日任务快速完成',
    category: 'task',
    mode: 'warfare',
    modeName: '全面战场',
    priceUnit: 'match',
    unitName: '局',
    basePrice: 1000,
    coverGradient: 'linear-gradient(135deg, #4D7CFF, #2ECC71)',
    coverText: '任务陪练',
    tags: ['每日任务', '快速完成'],
    sales: 388,
    rating: 4.7
  },
  {
    id: 's010',
    title: '烽火地带 · 高段位陪玩',
    subtitle: '少校分段以上大神',
    category: 'rank',
    mode: 'hazard',
    modeName: '烽火地带',
    priceUnit: 'hour',
    unitName: '小时',
    basePrice: 5000,
    coverGradient: 'linear-gradient(135deg, #FFD34D, #FF5B6A)',
    coverText: '高段位',
    tags: ['高段位', '车队指挥', '胜率保障'],
    sales: 256,
    rating: 5.0
  }
]

// 折扣表：数量/时长越大折扣越大
const DISCOUNT = { 1: 1, 2: 0.95, 3: 0.95, 4: 0.9, 5: 0.9, 8: 0.85, 10: 0.85 }

function buildSpecs(service) {
  const unitList = service.priceUnit === 'hour'
    ? [{ value: 1, label: '1小时' }, { value: 2, label: '2小时' }, { value: 4, label: '4小时' }, { value: 8, label: '8小时' }]
    : [{ value: 1, label: '1局' }, { value: 3, label: '3局' }, { value: 5, label: '5局' }, { value: 10, label: '10局' }]
  return unitList.map(function (s) {
    const discount = DISCOUNT[s.value] || 1
    return {
      value: s.value,
      label: s.label,
      price: Math.round(service.basePrice * s.value * discount)
    }
  })
}

function decorate(service) {
  const copy = JSON.parse(JSON.stringify(service))
  copy.specs = buildSpecs(copy)
  copy.serviceRules = COMMON_RULES.slice()
  copy.notice = COMMON_NOTICE.slice()
  // 上下架标记：后台管理可下架；未配置时默认上架
  copy.isOnSale = copy.isOnSale === undefined ? true : copy.isOnSale
  return copy
}

// 缓存构建后的完整服务列表
const SERVICES = RAW_SERVICES.map(decorate)

function cloneList(list) {
  return JSON.parse(JSON.stringify(list))
}

/** 首页数据：banner + 分类 + 热门服务 */
function getHomeData() {
  return {
    banners: cloneList(BANNERS),
    categories: cloneList(CATEGORIES),
    hotServices: cloneList(SERVICES.slice(0, 6))
  }
}

/** 服务列表：支持按分类/模式/关键词过滤与排序；已下架服务不展示 */
function getServiceList(params) {
  params = params || {}
  let list = SERVICES.slice().filter(function (s) { return s.isOnSale !== false })
  if (params.category && params.category !== 'all') {
    list = list.filter(function (s) { return s.category === params.category })
  }
  if (params.mode && params.mode !== 'all') {
    list = list.filter(function (s) { return s.mode === params.mode })
  }
  if (params.keyword) {
    const kw = params.keyword
    list = list.filter(function (s) {
      return s.title.indexOf(kw) > -1 || s.subtitle.indexOf(kw) > -1
    })
  }
  const sort = params.sort || 'sales'
  if (sort === 'price_asc') list.sort(function (a, b) { return a.specs[0].price - b.specs[0].price })
  else if (sort === 'price_desc') list.sort(function (a, b) { return b.specs[0].price - a.specs[0].price })
  else list.sort(function (a, b) { return b.sales - a.sales })
  return cloneList(list)
}

/** 服务详情（已下架服务返回 null，视为不存在） */
function getServiceById(id) {
  const found = SERVICES.find(function (s) { return s.id === id && s.isOnSale !== false })
  return found ? JSON.parse(JSON.stringify(found)) : null
}

module.exports = {
  BANNERS: BANNERS,
  CATEGORIES: CATEGORIES,
  getHomeData: getHomeData,
  getServiceList: getServiceList,
  getServiceById: getServiceById
}
