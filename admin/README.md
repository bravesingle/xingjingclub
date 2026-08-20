# 星竞电竞 · 管理控制台（admin）

运营 / 客服使用的 Web 管理后台，与小程序前端同一仓库（`admin/` 子目录）。

## 技术栈

- Vue 3（`<script setup>`）+ Vue Router 4 + Element Plus + ECharts + axios
- Vite 构建；**数据已对接后端 `server/`**（接口地址在 `src/api/base.js` 的 `API_BASE`）

## 快速开始

```bash
cd admin
npm install
npm run dev        # 开发：http://localhost:5173
npm run build      # 构建：dist/ 目录
npm run preview    # 预览构建产物
```

- **先启动后端**（见 `server/README.md`），再登录后台
- **登录账号**：`admin` / `admin123`（后端 seed 生成，接口 `/admin/auth/login` 校验）
- 浏览器打开后进入 `#/login`，登录后进入数据统计页

## 功能模块

| 路由 | 模块 | 能力 |
| --- | --- | --- |
| /dashboard | 数据统计 | 今日/累计订单与销售额、状态分布饼图、近14天趋势折线图、打手在线概览（后端 `/admin/stats/dashboard`） |
| /services | 服务商品 | 新增/编辑/删除、上架下架（小程序端同步隐藏）、按折扣规则自动生成规格 |
| /orders | 订单管理 | 全量订单筛选检索、详情抽屉、取消/开始服务/标记完成/同意退款/驳回退款 |
| /users | 用户管理 | 用户检索、封禁/解封、新增用户 |
| /boosters | 打手管理 | 入驻审核、上线/离线、接单中切换、评分段位维护 |
| /settings | 系统设置 | 客服微信、公告、支付超时、开放下单开关、支付方式 |

## 数据说明

- 所有数据来自后端 MySQL（`server/`），金额单位「分」，展示层统一 `fenToYuan`
- 订单状态机与后端/小程序一致：`pending_pay → paid → in_progress → completed`，含 `cancelled / refunding / refunded`
- 401 时自动清除登录态并跳回登录页（axios 拦截器统一处理）

## 目录结构

```
admin/
├── index.html / vite.config.js / package.json
└── src/
    ├── main.js / App.vue / router/ / stores/auth.js / styles/index.css
    ├── layout/AdminLayout.vue        # 侧边栏 + 顶栏
    ├── api/                          # 后端接口层（axios）
    │   ├── base.js                   # HTTP 封装（token/401 处理）+ 工具
    │   ├── service.js / order.js / user.js / booster.js / settings.js
    └── views/
        ├── Login.vue / Dashboard.vue
        ├── Services.vue / Orders.vue / Users.vue / Boosters.vue / Settings.vue
```

## 切换环境

后端地址在 `src/api/base.js` 顶部 `API_BASE` 常量修改（开发 `http://127.0.0.1:3000/api`，上线替换为 https 域名）。
