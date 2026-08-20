import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import Redis from 'ioredis'

/**
 * Redis 封装：JSON 自动序列化 + TTL
 * 用途：接口缓存（首页聚合/服务列表/统计）、支付超时记录等
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client: Redis

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          this.logger?.warn?.('Redis 重连超限，放弃连接')
          return null
        }
        return Math.min(times * 200, 2000)
      }
    })
    this.client.on('error', (err) => this.logger.error('Redis 错误: ' + err.message))
    this.client.on('connect', () => this.logger.log('Redis 已连接'))
  }

  async get<T = any>(key: string): Promise<T | null> {
    const raw = await this.client.get(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return raw as unknown as T
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const raw = typeof value === 'string' ? value : JSON.stringify(value)
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, raw, 'EX', ttlSeconds)
    } else {
      await this.client.set(key, raw)
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length) await this.client.del(...keys)
  }

  /** 按模式删除，如 delPattern('cache:services:*') */
  async delPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern)
    if (keys.length) await this.client.del(...keys)
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key)
  }

  /** 原始客户端（特殊需求用） */
  getClient(): Redis {
    return this.client
  }

  onModuleDestroy() {
    this.client?.disconnect()
  }
}
