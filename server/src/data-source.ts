import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { config as loadEnv } from 'dotenv'

// 供 TypeORM CLI / 种子脚本使用；应用运行时由 app.module 配置
loadEnv()

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'xingjing',
  charset: 'utf8mb4',
  // 开发期自动同步表结构；生产环境建议改为 migration
  synchronize: true,
  entities: [__dirname + '/**/*.entity{.ts,.js}']
})
