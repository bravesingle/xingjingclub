# 星竞电竞 · 三角洲行动陪玩小程序

《三角洲行动》陪玩服务全栈项目：微信小程序（玩家 + 打手双端）+ Web 管理控制台 + NestJS 后端。

## 核心功能

- **玩家端**：首页浏览、服务详情、下单、支付（模拟）、订单管理、退款、个人中心
- **打手端**：入驻申请、工作台接单、订单聊天、钱包提现、押金
- **管理后台**：数据统计、服务商品（含图片上传）、订单管理（含聊天记录查看）、用户/打手管理、提现审核、系统设置（押金/抽成/T+3）
- **后端**：微信登录（mock/真实）、订单状态机、WebSocket 实时聊天、押金 + 收入 T+3 提现结算

## 目录

| 目录 | 说明 | 运行方式 |
| --- | --- | --- |
| 项目根目录 | 微信小程序（原生，零构建） | 微信开发者工具导入本目录 |
| `admin/` | 运营/客服 Web 管理后台（Vue3 + Element Plus） | `cd admin && npm install && npm run dev` |
| `server/` | 后端 API（NestJS + MySQL + Redis） | `cd server && docker compose up -d && npm install && npm run seed && npm run start:dev` |

- 小程序默认对接本地后端（`config/index.js` 的 `useMock=false`，`baseUrl=http://127.0.0.1:3000/api`），微信工具需勾选「不校验合法域名」
- 后台管理员 `admin / admin123`；后端管理员 `admin / admin123`；Swagger 文档：`http://localhost:3000/api/docs`
- 详见各子目录 README 与根目录 [ARCHITECTURE.md](ARCHITECTURE.md)

## 快速开始（三端一起跑）

```bash
# 1. 后端（先启动）
cd server && docker compose up -d && npm run seed && npm run start:dev

# 2. 管理后台
cd admin && npm run dev          # http://localhost:5173  admin/admin123

# 3. 小程序
# 微信开发者工具导入项目根目录 → 详情勾选「不校验合法域名」→ 编译
```

## 常用配置

| 配置 | 位置 | 说明 |
| --- | --- | --- |
| 后端地址 | `config/index.js` baseUrl | 小程序联调地址 |
| 押金金额 / 抽成 / T+3 | 后台「系统设置」 | 资金规则可配 |
| 微信登录 / 支付开关 | `server/.env` | WECHAT_MOCK / PAY_MOCK |

## 文档

- [架构设计](ARCHITECTURE.md) — 模块设计、数据模型、接口契约、订单状态机、支付方案、双角色与资金说明
