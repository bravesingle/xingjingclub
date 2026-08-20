# 星竞电竞 · 三角洲行动陪玩微信小程序 — 前端架构设计

> 版本：1.0.0 ｜ 技术栈：原生微信小程序（WXML / WXSS / JS，无构建依赖）

---

## 1. 项目概述

「星竞电竞」是一个面向《三角洲行动》玩家的陪玩服务小程序，提供排位上分、摸金带飞、任务通关、全面战场陪玩等服务的下单与支付。

**本期范围（P0）**

| 模块 | 说明 |
| --- | --- |
| 首页 | Banner 轮播、服务分类导航、热门服务推荐 |
| 服务浏览 | 分类筛选、排序、服务详情（规格选择） |
| 下单 | 确认订单（规格/数量/备注）→ 创建订单 |
| 支付 | 收银台、微信支付（预留真实链路）、开发期模拟支付 |
| 订单管理 | 列表（按状态筛选）、详情、取消、确认完成 |
| 售后 | 申请退款、退款进度展示 |
| 用户 | 登录（开发期本地模拟）、个人中心、客服入口 |

**暂不包含**：打手（陪玩师）模块 —— 架构中已预留扩展点（见 §10）；小程序端暂不做，但**管理控制台已先行提供打手管理**（入驻审核/上下线/接单状态，见 §14）。

## 14. 管理控制台（admin/，Web）

运营与客服使用的独立 Web 后台（Vue3 + Element Plus + ECharts，Vite 构建），与小程序同仓库。

- **模块**：数据统计看板、服务商品管理（增删改/上下架）、订单管理（状态流转/退款审核）、用户管理（封禁/解封）、打手管理（审核/上线/接单）、系统设置
- **数据**：与小程序 mock 对齐的种子数据 + localStorage 持久化（刷新不丢）；切真实后端时替换 `admin/src/api/*` 内部实现（契约见 §7）
- **联动点**：服务「下架」后小程序端不再展示（`mock/index.js` 已按 `isOnSale` 过滤）；订单状态机与小程序完全一致
- **登录**：本地模拟账号 `admin / admin123`（见 `admin/README.md`）

## 15. 后端服务（server/，NestJS + MySQL + Redis）

为小程序与管理后台提供统一 API（详见 `server/README.md`）。

- **技术栈**：NestJS 11 + TypeORM(MySQL 8) + Redis 7（ioredis 缓存封装）+ JWT 认证
- **契约**：统一响应 `{ code, data, msg }`（code 0 成功 / 401 登录失效），与小程序 `utils/request.js` 完全对齐；金额单位「分」
- **认证**：小程序微信登录（`WECHAT_MOCK=true` 时本地派生 openid，真实环境走 jscode2session）；管理员独立 JWT（role=admin，`AdminGuard` 保护全部 `/admin/*`）
- **模块**：auth（登录）、users、services（规格折扣生成 + 首页 Redis 缓存）、orders（7 状态状态机 + 退款驳回回退 `refundFrom`）、pay（mock + 微信商户接入点）、boosters、stats（看板 + 14 天趋势）、settings、admin（管理端全套接口）
- **数据**：`scripts/seed.ts` 初始化管理员/10 服务/5 打手/6 用户/7 示例订单；`docker-compose.yml` 一键起 MySQL+Redis
- **文档**：Swagger 在线接口文档（`/api/docs`）；已通过 `nest build` 编译与端到端接口验证（登录→下单→支付→管理端统计全链路）

---

## 2. 技术选型与运行

- **框架**：原生微信小程序，零 npm 依赖、零构建步骤，微信开发者工具直接导入即可运行
- **AppID**：`project.config.json` 使用 `touristappid`（游客/测试模式），上线前替换为正式 AppID
- **数据**：无后端阶段由 `mock/` 提供本地数据（`config.useMock = true`）；后端就绪后切换 `useMock = false` 走真实接口，接口契约见 §7
- **基础库**：3.6.4（`libVersion`）
- **主题**：暗色电竞风，全局 CSS 变量定义于 `app.wxss`

## 3. 目录结构

```
三角洲陪玩小程序/
├── project.config.json        # 开发者工具项目配置
├── sitemap.json
├── app.js                     # 全局入口（globalData）
├── app.json                   # 页面注册 / tabBar / 窗口配置
├── app.wxss                   # 全局主题变量 + 通用样式类
├── config/
│   └── index.js               # 环境配置（mock 开关 / 支付开关 / 品牌信息）
├── utils/
│   ├── request.js             # wx.request 封装（Promise / token / 统一报错）
│   ├── auth.js                # 登录态持久化与守卫
│   └── format.js              # 分转元 / 时间 / 订单状态文案
├── api/                       # 业务接口层（mock 与真实接口双通道）
│   ├── service.js             # 首页聚合 / 服务列表 / 服务详情
│   ├── order.js               # 创建 / 列表 / 详情 / 取消 / 完成 / 退款 / 统计
│   ├── pay.js                 # 支付参数 / 模拟支付 / 支付结果
│   └── user.js                # 登录 / 用户信息 / 退出
├── mock/                      # 本地数据（无后端阶段）
│   ├── index.js               # 首页数据 + 服务商品（含规格生成、折扣）
│   ├── order.js               # 订单内存态仓库（种子数据）
│   └── user.js                # 用户登录模拟
├── components/                # 通用组件
│   ├── service-card/          # 服务卡片（点击进详情）
│   ├── order-card/            # 订单卡片（状态操作事件）
│   ├── stepper/               # 数量步进器
│   ├── countdown/             # 倒计时（支付时限）
│   └── empty/                 # 空状态
└── pages/
    ├── index/                 # 首页（tab）
    ├── service-list/          # 服务列表（分类/排序）
    ├── service-detail/        # 服务详情（规格选择 → 下单）
    ├── order-confirm/         # 确认订单
    ├── order-pay/             # 收银台（支付）
    ├── order-list/            # 订单列表（tab，状态筛选）
    ├── order-detail/          # 订单详情（状态操作）
    ├── order-refund/          # 申请退款
    ├── user/                  # 个人中心（tab）
    └── login/                 # 登录
```

## 4. 分层设计

```
┌────────────────────────────────────────────┐
│ 视图层  pages/（10 个页面）                   │
│   页面 .js 只做：取参 → 调 api → setData      │
├────────────────────────────────────────────┤
│ 组件层  components/（5 个通用组件）            │
│   复用展示、事件上抛（triggerEvent）           │
├────────────────────────────────────────────┤
│ 业务层  api/（service / order / pay / user） │
│   config.useMock ? mock 数据 : request 请求   │
├────────────────────────────────────────────┤
│ 数据层  mock/（内存态 + 本地缓存）             │
├────────────────────────────────────────────┤
│ 基础设施  utils/（request / auth / format）   │
│           config/（开关与常量）               │
└────────────────────────────────────────────┘
```

设计原则：

- **页面瘦**：页面不直接 `wx.request`，一律走 `api/` 层，便于切换 mock/真实后端
- **组件上抛事件**：卡片类组件不自己改数据，只 `triggerEvent` 交给页面处理
- **金额用「分」**：全程整数运算避免浮点误差，展示层统一 `format.fenToYuan`
- **tab 导航规范**：tab 页（首页/订单/我的）之间必须 `wx.switchTab`；tab 页间传参用本地缓存键 `xjes_order_tab`

## 5. 核心模块设计

### 5.1 首页（pages/index）
Banner 轮播 + 4 类服务分类入口 + 热门服务列表（`service-card`），下拉刷新。

### 5.2 服务列表 / 详情（service-list / service-detail）
- 列表：分类 tab + 排序（综合/价格升/价格降）
- 详情：规格选择（按时长或按局计价，长时折扣）、数量步进、服务规则与下单须知、底部「客服 + 立即下单」
- 下单前置校验：`auth.requireLogin()` 未登录跳登录页

### 5.3 下单（order-confirm）
确认规格/数量/备注 → 展示价格明细 → 创建订单 → `redirectTo` 收银台。

### 5.4 支付（order-pay）→ 详见 §8

### 5.5 订单管理（order-list / order-detail）
- 列表：全部/待支付/服务中/已完成/已取消
- 详情：状态头 + 倒计时 + 服务信息 + 订单信息 + 按状态展示操作（去支付/取消/确认完成/申请退款/再来一单/联系客服）

### 5.6 售后（order-refund）
选择退款原因 + 补充说明 → 提交 → 状态流转 `refunding`，详情页展示进度。

### 5.7 用户（user / login）
开发期本地模拟登录（昵称 + 三角洲游戏ID），保存 token 至本地；个人中心展示订单统计、客服、关于、退出登录。

## 6. 数据模型（前端约定，后端按此对齐）

### Service 服务商品
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 服务ID |
| title / subtitle | string | 标题 / 副标题 |
| category | string | rank 排位 / loot 摸金 / task 任务 / warfare 战场 |
| mode / modeName | string | hazard 烽火地带 / warfare 全面战场 |
| priceUnit | string | hour 按小时 / match 按局 |
| unitName | string | 单位文案（小时/局） |
| basePrice | number | 起步单价（分） |
| specs | array | 规格：[{ value, label, price(分) }]，长时自动折扣 |
| tags | array | 服务标签 |
| sales / rating | number | 销量 / 评分 |
| coverGradient / coverText | string | 封面占位（未接图片 CDN） |
| serviceRules / notice | array | 服务规则 / 下单须知 |

### Order 订单
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id / orderNo | string | 订单ID / 单号（XJ+时间戳+随机） |
| serviceId / serviceTitle | string | 关联服务 |
| specLabel / specValue / quantity | 混合 | 规格与数量 |
| unitPrice / amount | number | 单价 / 实付（分） |
| status | string | 见 §7 状态机 |
| remark / contact | string | 备注 / 联系方式 |
| createdAt / payExpireAt | number | 创建时间 / 支付时限 |
| paidAt / startedAt / completedAt / cancelledAt / refundedAt | number | 各状态时间戳 |
| refundReason | string | 退款原因 |
| serveBy | string | **预留**：打手昵称（打手模块上线后填充） |

### User 用户
nickname、avatar、gameId（三角洲游戏ID）、level、vip、registeredAt。

## 7. 接口契约（后端对齐用）

统一响应：`{ code: 0, data, msg }`，`code 0` 成功，`401` 登录失效（前端自动跳登录）。

| 方法 | 路径 | 说明 | 入参 | 出参 data |
| --- | --- | --- | --- | --- |
| GET | /home/data | 首页聚合 | - | { banners, categories, hotServices } |
| GET | /services | 服务列表 | category/mode/keyword/sort | Service[] |
| GET | /services/:id | 服务详情 | - | Service |
| POST | /orders | 创建订单 | { serviceId, specValue, quantity, remark, contact } | Order |
| GET | /orders | 订单列表 | status | Order[] |
| GET | /orders/counts | 订单统计 | - | { pending_pay, in_progress, completed } |
| GET | /orders/:id | 订单详情 | - | Order |
| POST | /orders/:id/cancel | 取消 | { reason } | Order |
| POST | /orders/:id/complete | 确认完成 | - | Order |
| POST | /orders/:id/refund | 申请退款 | { reason, detail } | Order |
| POST | /pay/wechat/prepay | 微信预下单 | { orderId } | { payParams } |
| GET | /pay/result | 支付结果 | orderId | { paid } |
| POST | /user/login | 登录（wx.login code 换 token） | { code, nickname, gameId } | { token, userInfo } |
| GET | /user/info | 用户信息 | - | User |
| POST | /user/info | 更新资料 | patch | User |

## 8. 支付设计

### 8.1 真实链路（后端就绪后启用）
1. 前端 `POST /pay/wechat/prepay` 拿 `payParams`
2. `wx.requestPayment(payParams)` 拉起微信支付
3. 支付结果以后端异步回调为准，前端 `GET /pay/result` 轮询兜底

```
下单 → 确认订单 → 创建订单(pending_pay) → 收银台
  → /pay/wechat/prepay → wx.requestPayment → 回调/轮询 → paid
```

### 8.2 开发期模拟支付
`config.useMockPay = true` 时收银台显示「模拟支付」，直接置订单为 `paid`，方便在开发者工具里完整走通流程。

### 8.3 支付时限
`config.payTimeoutMinutes = 15`，收银台与详情页用 `countdown` 组件展示倒计时；超时提示订单自动取消（生产环境由后端定时任务置 `cancelled`）。

## 9. 订单状态机

```
                    ┌──────────────────────────────┐
 pending_pay ──支付──► paid ──开始服务──► in_progress ──确认完成──► completed
     │                │  ▲                     │                    │
     │取消             │  │                     └── 申请退款 ──► refunding ──► refunded
     ▼                │  └──── 取消(未开始)             │
 cancelled ◄──────────┘                              (客服介入/驳回可回流)
```

| status | 文案 | 可操作（前端） |
| --- | --- | --- |
| pending_pay | 待支付 | 去支付 / 取消订单 |
| paid | 已支付 | 申请退款 / 联系客服 |
| in_progress | 服务中 | 确认完成 / 联系客服 |
| completed | 已完成 | 售后(申请退款) / 再来一单 |
| cancelled | 已取消 | - |
| refunding | 退款中 | 联系客服 |
| refunded | 已退款 | - |

## 10. 打手模块预留（P1/P2）

本期不含打手端，但已预留扩展点：

- 订单模型已含 `serveBy` 字段（打手昵称）
- 状态机可自然扩展：`paid → assigned(已派单) → in_progress`
- 建议后续新增：`pages/booster-*`（打手工作台）、`api/booster.js`、`mock/booster.js`，服务详情增加「打手信息」区块，订单详情增加「派单进度」
- 权限侧建议引入角色字段（user.role: player / booster / admin）

## 11. 设计规范

| 变量 | 值 | 用途 |
| --- | --- | --- |
| --bg | #0F1222 | 页面背景 |
| --bg-card | #171C33 | 卡片 |
| --bg-card-2 | #1D2340 | 输入框/次级块 |
| --line | #262D4F | 分割线 |
| --text-main / --text-sub / --text-dim | #E8EAF2 / #9AA0B5 / #6B7189 | 三级文字 |
| --primary / --primary-2 | #4D7CFF / #7B5CFF | 主操作渐变 |
| --gold / --gold-2 | #FFD34D / #FFA940 | 价格/强调 |
| --success / --danger / --warning | #2ECC71 / #FF5B6A / #FF9F43 | 状态色 |

- 圆角 20rpx（卡片）/ 44rpx（按钮）；页面边距 24rpx；行高 1.5
- 金额统一金色加粗，价格一律「分」存储

## 12. 开发计划

- **P0（本期）**：项目骨架 + 首页浏览 + 下单 + 支付（模拟）+ 订单管理 + 退款 + 登录/个人中心 ✅
- **P0.5**：Web 管理控制台（统计/服务/订单/用户/打手/设置）✅
- **P1**：NestJS 后端（微信登录 mock/真实、订单、支付、退款）+ 前后端对接 ✅
- **P2（本期新增，已实现）**：
  - 订单内打手-玩家聊天（WebSocket 实时 + 后台只读查看）✅
  - 打手/玩家双角色登录（手机号识别 + 入驻申请 + 按角色切换 tabBar）✅
  - 商品图片上传（后台 el-upload + 后端 /uploads 本地存储）✅
  - 微信手机号授权绑定身份（开发期 mock，真实环境接 getPhoneNumber）✅
  - 打手押金（¥200 可配）+ 收入 T+3 解冻 + 提现 + 后台审核 ✅
- **P3（待做）**：真实微信登录/支付商户、头像昵称规范、优惠券/会员体系、订单评价、消息订阅推送

## 16. 双角色与资金（P2 实现说明）

- **角色**：`users.role`（player/booster）；登录时手机号命中「已审核打手」→ booster；入驻申请 → 后台审核
- **打手端**：自定义 tabBar 按角色切换（打手=工作台/消息/我的；玩家=首页/订单/我的）
- **资金**：押金（`settings.depositAmount`，默认 ¥200）→ 接单 → 完成订单产生收入（`platformRate` 抽成）→ T+N（`settlementDays`，默认 3 天）解冻 → 提现 → 后台审核打款
- **聊天**：`chat_messages` 表 + WebSocket（`ws://host/chat`）+ 后台只读查看

## 13. 运行方式

1. 微信开发者工具 → 导入项目 → 选择本项目根目录
2. AppID 保持 `touristappid`（或选「测试号」），基础库 3.6.4+
3. 直接编译运行（默认走 mock 数据，无需后端）
4. 切换真实后端：修改 `config/index.js` 的 `useMock = false`、`useMockPay = false`、`baseUrl`
