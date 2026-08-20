/* eslint-disable no-console */
/**
 * 种子数据脚本：初始化管理员 / 服务 / 打手 / 用户 / 设置 / 示例订单
 * 用法：cp .env.example .env（按需修改）→ npm run seed
 */
import 'reflect-metadata'
import * as bcrypt from 'bcryptjs'
import { AppDataSource } from '../src/data-source'
import { Admin } from '../src/modules/admin/admin.entity'
import { GameService } from '../src/modules/services/service.entity'
import { ServiceSpec } from '../src/modules/services/service-spec.entity'
import { Booster } from '../src/modules/boosters/booster.entity'
import { User } from '../src/modules/users/user.entity'
import { Setting } from '../src/modules/settings/setting.entity'
import { Order } from '../src/modules/orders/order.entity'
import { SPEC_DISCOUNT, CATEGORY_NAME_MAP, MODE_NAME_MAP } from '../src/modules/services/services.constants'
import { genOrderNo } from '../src/modules/orders/orders.constants'

const DAY = 24 * 3600 * 1000
const NOW = Date.now()

function buildSpecs(priceUnit: string, basePrice: number) {
  const unitList =
    priceUnit === 'hour'
      ? [
          { value: 1, label: '1小时' },
          { value: 2, label: '2小时' },
          { value: 4, label: '4小时' },
          { value: 8, label: '8小时' }
        ]
      : [
          { value: 1, label: '1局' },
          { value: 3, label: '3局' },
          { value: 5, label: '5局' },
          { value: 10, label: '10局' }
        ]
  return unitList.map((s) => {
    const spec = new ServiceSpec()
    spec.value = s.value
    spec.label = s.label
    spec.price = Math.round(basePrice * s.value * (SPEC_DISCOUNT[s.value] || 1))
    return spec
  })
}

const RULES = [
  '下单后请添加客服微信确认游戏区服与上线时间；',
  '陪玩过程中请保持语音沟通，便于带队指挥；',
  '如遇网络波动等不可抗力，服务时间顺延；',
  '请勿在任何场景使用外挂，违者概不负责。'
]
const NOTICE = ['订单支付后不支持改单，请确认服务规格后下单；', '服务未开始前可申请全额退款；']

async function run() {
  await AppDataSource.initialize()
  console.log('✅ 数据库连接成功')

  const managers = {
    admin: AppDataSource.getRepository(Admin),
    service: AppDataSource.getRepository(GameService),
    booster: AppDataSource.getRepository(Booster),
    user: AppDataSource.getRepository(User),
    setting: AppDataSource.getRepository(Setting),
    order: AppDataSource.getRepository(Order)
  }

  // 清空（先删子表）
  await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0')
  for (const name of ['orders', 'service_specs', 'services', 'boosters', 'users', 'settings', 'admins']) {
    await AppDataSource.query(`DELETE FROM \`${name}\``)
  }
  await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1')
  console.log('🧹 已清空旧数据')

  // ===== 管理员（超级管理员 + 普通管理员）=====
  const admin = new Admin()
  admin.username = 'admin'
  admin.passwordHash = bcrypt.hashSync('admin123', 10)
  admin.name = '超级管理员'
  admin.role = 'super_admin'
  await managers.admin.save(admin)

  const operator = new Admin()
  operator.username = 'operator'
  operator.passwordHash = bcrypt.hashSync('operator123', 10)
  operator.name = '运营管理员'
  operator.role = 'admin'
  await managers.admin.save(operator)
  console.log('👤 超级管理员 admin / admin123')
  console.log('👤 普通管理员 operator / operator123')

  // ===== 服务 =====
  const rawServices: Array<[string, string, string, string, string, number, string, string[], string]> = [
    ['烽火地带 · 排位上分', '大神带队稳定冲分', 'rank', 'hazard', 'hour', 3000, '排位上分', ['高胜率', '语音带飞', '胜率保障'], 'linear-gradient(135deg,#3A5BFF,#7B5CFF)'],
    ['烽火地带 · 摸金带飞', '高价值地图物资收割', 'loot', 'hazard', 'hour', 3500, '摸金带飞', ['物资满配', '保底撤离', '安全房区'], 'linear-gradient(135deg,#FFA940,#FF5B6A)'],
    ['烽火地带 · 任务通关', '通行证任务一键搞定', 'task', 'hazard', 'hour', 2000, '任务通关', ['任务全清', '效率极高', '随时开打'], 'linear-gradient(135deg,#2ECC71,#3A5BFF)'],
    ['全面战场 · 大战场陪玩', '整活上分两不误', 'warfare', 'warfare', 'match', 1500, '全面战场', ['车队友好', '指挥到位', '稳定输出'], 'linear-gradient(135deg,#FF5B6A,#7B5CFF)'],
    ['烽火地带 · 排位保底套餐', '承包段位稳定冲分', 'rank', 'hazard', 'hour', 2800, '保底套餐', ['段位保底', '时长更优', '全程跟进'], 'linear-gradient(135deg,#3A5BFF,#2ECC71)'],
    ['全面战场 · 排位上分', '大战场冲分利器', 'rank', 'warfare', 'match', 1200, '战场冲分', ['高胜率', '车队开黑'], 'linear-gradient(135deg,#7B5CFF,#4D7CFF)'],
    ['烽火地带 · 萌新教学', '从零带你玩懂三角洲', 'task', 'hazard', 'hour', 1800, '萌新教学', ['新手友好', '基础教学', '点位讲解'], 'linear-gradient(135deg,#2ECC71,#FFA940)'],
    ['烽火地带 · 车队满配', '四排车队整装待发', 'loot', 'hazard', 'hour', 4000, '车队满配', ['四排', '物资拉满', '稳定撤离'], 'linear-gradient(135deg,#FFA940,#FFD34D)'],
    ['全面战场 · 任务陪练', '每日任务快速完成', 'task', 'warfare', 'match', 1000, '任务陪练', ['每日任务', '快速完成'], 'linear-gradient(135deg,#4D7CFF,#2ECC71)'],
    ['烽火地带 · 高段位陪玩', '少校分段以上大神', 'rank', 'hazard', 'hour', 5000, '高段位', ['高段位', '车队指挥', '胜率保障'], 'linear-gradient(135deg,#FFD34D,#FF5B6A)']
  ]
  const salesArr = [2314, 1876, 965, 1520, 732, 1103, 645, 498, 388, 256]
  const ratingArr = [4.9, 4.8, 4.9, 4.7, 4.9, 4.8, 5.0, 4.9, 4.7, 5.0]

  const services: GameService[] = []
  rawServices.forEach((r, i) => {
    const svc = new GameService()
    svc.title = r[0]
    svc.subtitle = r[1]
    svc.category = r[2]
    svc.categoryName = CATEGORY_NAME_MAP[r[2]]
    svc.mode = r[3]
    svc.modeName = MODE_NAME_MAP[r[3]]
    svc.priceUnit = r[4]
    svc.unitName = r[4] === 'match' ? '局' : '小时'
    svc.basePrice = r[5]
    svc.coverText = r[6]
    svc.tags = r[7]
    svc.coverGradient = r[8]
    svc.serviceRules = RULES.slice()
    svc.notice = NOTICE.slice()
    svc.sales = salesArr[i]
    svc.rating = ratingArr[i]
    svc.isOnSale = true
    svc.specs = buildSpecs(svc.priceUnit, svc.basePrice)
    services.push(svc)
  })
  await managers.service.save(services)
  console.log(`🎮 服务 ${services.length} 个（含规格）`)

  // ===== 打手（含手机号，用于登录身份匹配）=====
  const rawBoosters: Array<[string, string, string[], string, string, number, number, boolean, boolean, string]> = [
    ['夜风', '13800000001', ['rank', 'loot'], 'hazard', '少校', 4.9, 326, true, true, '专职烽火地带带队'],
    ['寒霜', '13800000002', ['rank', 'warfare'], 'warfare', '上校', 4.8, 258, true, false, '大战场指挥位'],
    ['北城', '13800000003', ['task'], 'hazard', '中尉', 4.7, 142, false, false, '任务效率王'],
    ['老白', '13800000004', ['loot'], 'hazard', '中校', 4.9, 412, true, true, '新入驻，待审核'],
    ['小北', '13800000005', ['warfare'], 'warfare', '少尉', 4.5, 30, true, true, '资质存疑，已驳回']
  ]
  for (const b of rawBoosters) {
    const booster = new Booster()
    booster.name = b[0]
    booster.phone = b[1]
    booster.categories = b[2]
    booster.categoryNames = b[2].map((c) => CATEGORY_NAME_MAP[c] || c)
    booster.mode = b[3]
    booster.rank = b[4]
    booster.rating = b[5]
    booster.orderCount = b[6]
    booster.online = b[7]
    booster.accepting = b[8]
    booster.audit = booster.name === '老白' ? 'pending' : booster.name === '小北' ? 'rejected' : 'approved'
    booster.joinedAt = NOW - Math.floor(Math.random() * 180 + 10) * DAY
    booster.remark = b[9]
    await managers.booster.save(booster)
  }
  console.log(`🎯 打手 ${rawBoosters.length} 个`)

  // ===== 用户（含手机号）=====
  const rawUsers: Array<[string, string, string, number, boolean]> = [
    ['阿凯', '13900000001', 'Kai_2024', 5, true],
    ['摸金校尉', '13900000002', 'Mojin_88', 3, false],
    ['钢枪王', '13900000003', 'GangQiang_W', 7, true],
    ['新手小白', '13900000004', 'XinShou_01', 1, false],
    ['任务狂人', '13900000005', 'RW_KuangRen', 4, false],
    ['高分段玩家', '13900000006', 'GaoFen_Duan', 8, true]
  ]
  for (const u of rawUsers) {
    const user = new User()
    user.openid = 'seed_' + Math.random().toString(36).slice(2, 14)
    user.nickname = u[0]
    user.phone = u[1]
    user.gameId = u[2]
    user.level = u[3]
    user.vip = u[4]
    user.banned = u[0] === '任务狂人'
    user.orderCount = 0
    user.totalSpend = 0
    await managers.user.save(user)
  }
  console.log(`👥 用户 ${rawUsers.length} 个`)

  // ===== 设置 =====
  const settingsRepo = managers.setting
  await settingsRepo.save([
    settingsRepo.create({ key: 'customerServiceWechat', value: JSON.stringify('XJES-KF') }),
    settingsRepo.create({ key: 'notice', value: JSON.stringify('星竞电竞 · 大神陪玩，稳定上分！') }),
    settingsRepo.create({ key: 'payTimeoutMinutes', value: JSON.stringify(15) }),
    settingsRepo.create({ key: 'orderOpen', value: JSON.stringify(true) }),
    settingsRepo.create({ key: 'payWechat', value: JSON.stringify(true) }),
    settingsRepo.create({ key: 'payBalance', value: JSON.stringify(false) })
  ])
  console.log('⚙️ 系统设置已初始化')

  // ===== 示例订单（覆盖状态机，便于联调） =====
  const users = await managers.user.find()
  const svcs = await managers.service.find({ relations: { specs: true } })
  if (users.length && svcs.length) {
    const mkOrder = (idx: number, status: string, extra: Partial<Order> = {}) => {
      const svc = svcs[idx % svcs.length]
      const spec = svc.specs[0]
      const o = new Order()
      o.orderNo = genOrderNo()
      o.userId = users[idx % users.length].id
      o.serviceId = svc.id
      o.serviceTitle = svc.title
      o.subtitle = svc.subtitle
      o.modeName = svc.modeName
      o.coverGradient = svc.coverGradient
      o.coverText = svc.coverText
      o.specLabel = spec.label
      o.specValue = spec.value
      o.quantity = 1
      o.unitPrice = spec.price
      o.amount = spec.price
      o.status = status
      o.payExpireAt = NOW + 15 * 60 * 1000
      Object.assign(o, extra)
      return o
    }
    const orders = [
      mkOrder(0, 'pending_pay'),
      mkOrder(1, 'paid', { paidAt: NOW - 10 * 60 * 1000 }),
      mkOrder(2, 'in_progress', { paidAt: NOW - 2 * 3600 * 1000, startedAt: NOW - 2 * 3600 * 1000 + 600000, serveBy: '夜风' }),
      mkOrder(3, 'completed', { paidAt: NOW - 3 * DAY, startedAt: NOW - 3 * DAY + 600000, completedAt: NOW - 3 * DAY + 2 * 3600 * 1000, serveBy: '寒霜' }),
      mkOrder(4, 'cancelled', { cancelledAt: NOW - 2 * DAY }),
      mkOrder(5, 'refunding', { paidAt: NOW - 6 * 3600 * 1000, refundReason: '服务不满意', refundFrom: 'paid' }),
      mkOrder(6, 'refunded', { paidAt: NOW - 4 * DAY, refundReason: '重复下单', refundFrom: 'completed', refundedAt: NOW - 3 * DAY })
    ]
    await managers.order.save(orders)
    console.log(`🧾 示例订单 ${orders.length} 个（覆盖全部状态）`)
  }

  await AppDataSource.destroy()
  console.log('\n🎉 种子数据完成！')
  console.log('   管理员: admin / admin123')
  console.log('   启动服务: npm run start:dev  →  http://localhost:3000/api')
  console.log('   Swagger:  http://localhost:3000/api/docs')
}

run().catch((e) => {
  console.error('❌ 种子数据失败:', e)
  process.exit(1)
})
