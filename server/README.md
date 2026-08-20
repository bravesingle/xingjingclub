# 星竞电竞 · 后端服务（server/）

NestJS + TypeORM(MySQL) + Redis，为小程序前端与管理控制台提供统一 API。

## 技术栈

- **框架**：NestJS 11（TypeScript）
- **数据库**：MySQL 8（TypeORM，开发期 `synchronize` 自动建表）
- **缓存**：Redis 7（ioredis 封装：首页聚合、统计看板缓存）
- **认证**：JWT（小程序用户 + 管理员共用签发逻辑，role 区分）
- **文档**：Swagger（`/api/docs`）

## 快速开始

```bash
# 1. 启动 MySQL + Redis（需 Docker）
docker compose up -d

# 2. 配置环境变量
cp .env.example .env        # 按需修改数据库密码等

# 3. 安装依赖 + 初始化种子数据（管理员/服务/打手/用户/示例订单）
npm install
npm run seed

# 4. 启动开发服务
npm run start:dev           # http://localhost:3000/api
```

- **Swagger 文档**：http://localhost:3000/api/docs
- **管理员账号**：`admin` / `admin123`（seed 生成，bcrypt 加密）
- 无 Docker 时：使用本机 MySQL/Redis，在 `.env` 中改连接信息即可

## 接口契约

统一响应：`{ code, data, msg }`
- `code = 0` 成功；`code = 401` 登录失效（前端自动跳登录页）；其余为业务/HTTP 错误码
- 需登录接口携带 `Authorization: Bearer <token>`
- 金额单位一律「分」，与前端一致

### 小程序端
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /api/auth/wechat-login | 微信登录（code 换 token+用户） |
| GET | /api/home/data | 首页聚合（banner/分类/热门，Redis 缓存） |
| GET | /api/services | 服务列表（仅上架/分类/排序/分页） |
| GET | /api/services/:id | 服务详情 |
| GET/POST | /api/user/info | 用户信息/更新资料 |
| POST | /api/orders | 创建订单 |
| GET | /api/orders | 我的订单列表 |
| GET | /api/orders/counts | 订单统计 |
| GET | /api/orders/:id | 订单详情 |
| POST | /api/orders/:id/cancel\|complete\|refund | 取消/完成/退款 |
| POST | /api/pay/wechat/prepay | 支付预下单（mock） |
| POST | /api/pay/mock | 模拟支付（开发期） |
| GET | /api/pay/result | 支付结果 |
| GET | /api/settings/public | 公告/客服微信/下单开关 |
| GET | /api/boosters | 可接单打手列表（P2） |

### 管理端（需管理员 token，`/admin/*` 全部校验 role=admin）
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /api/admin/auth/login | 管理员登录 |
| GET/POST | /api/admin/services | 服务列表/新增 |
| PUT/PATCH/DELETE | /api/admin/services/:id | 编辑/上下架/删除 |
| GET | /api/admin/orders | 订单列表 |
| POST | /api/admin/orders/:id/action | 状态流转（cancel/start/complete/approve_refund/reject_refund） |
| GET/PATCH/POST | /api/admin/users | 用户列表/封禁/新增 |
| GET/POST/PATCH | /api/admin/boosters | 打手列表/新增/更新（审核/上下线/接单） |
| GET | /api/admin/stats/dashboard | 统计看板（订单/趋势/打手概览） |
| GET/PUT/POST | /api/admin/settings | 设置读取/更新/重置 |

## 配置说明（.env）

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| WECHAT_MOCK | true | 微信登录 mock（未配 appid/secret 时自动生效） |
| WECHAT_APPID / WECHAT_SECRET | 空 | 真实微信登录时填写 |
| PAY_MOCK | true | 支付 mock；真实微信支付需商户接入 |
| PAY_EXPIRE_MINUTES | 15 | 订单支付时限 |
| JWT_SECRET / JWT_EXPIRES_IN | - / 7d | 令牌密钥与有效期 |

## 目录结构

```
server/
├── docker-compose.yml         # MySQL8 + Redis7
├── scripts/seed.ts            # 种子数据
└── src/
    ├── main.ts                # 入口：前缀 /api、Swagger、全局管道/拦截器/过滤器
    ├── app.module.ts          # 根模块（TypeORM/Redis/JWT/全局守卫 + 业务模块）
    ├── common/                # 公共层：响应拦截器/异常过滤器/JWT守卫/Admin守卫/装饰器/DTO
    ├── redis/                 # ioredis 封装（get/set/del/缓存模式删除）
    ├── data-source.ts         # TypeORM 数据源（seed 用）
    └── modules/
        ├── auth/              # 微信登录（mock/真实双通道）+ JWT
        ├── users/             # 用户信息
        ├── services/          # 服务商品 + 规格生成 + 首页缓存
        ├── orders/            # 订单状态机（7 状态 + 退款回退）
        ├── pay/               # 支付（mock + 真实接入点）
        ├── boosters/          # 打手
        ├── stats/             # 统计看板
        ├── settings/          # 系统设置
        └── admin/             # 管理端全部接口（AdminGuard）
```

## 上线注意事项

- 生产环境：`synchronize` 改 `false`，使用 TypeORM migration 管理表结构
- 数据库密码、JWT_SECRET 必须更换为强随机值
- 微信登录/支付需配置正式 appid/secret 与商户号，`WECHAT_MOCK=false`、`PAY_MOCK=false`
- 部署可用 `npm run build` 产出 dist，`node dist/main` 运行（或 Dockerfile + PM2）
