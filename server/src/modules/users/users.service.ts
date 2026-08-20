import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { User } from './user.entity'
import { toUserVO } from './user.vo'
import { Order } from '../orders/order.entity'
import { Booster } from '../boosters/booster.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Booster)
    private readonly boosterRepo: Repository<Booster>
  ) {}

  findByOpenid(openid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { openid } })
  }

  /** 按手机号查找（普通用户身份锚点用，取最近注册） */
  findByPhone(phone: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { phone }, order: { id: 'DESC' } })
  }

  findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } })
  }

  /** 批量查询（订单列表带玩家昵称用） */
  async findByIds(ids: number[]): Promise<User[]> {
    if (!ids.length) return []
    return this.userRepo.find({ where: { id: In(ids) } })
  }

  async findByIdOrFail(id: number): Promise<User> {
    const user = await this.findById(id)
    if (!user) throw new NotFoundException('用户不存在')
    return user
  }

  create(data: Partial<User>): Promise<User> {
    return this.userRepo.save(this.userRepo.create(data))
  }

  async update(id: number, patch: Partial<User>): Promise<User> {
    const user = await this.findByIdOrFail(id)
    Object.assign(user, patch)
    return this.userRepo.save(user)
  }

  /** 管理端：用户列表（关键词：昵称/游戏ID） */
  async adminList(params: { keyword?: string; page: number; pageSize: number }) {
    const qb = this.userRepo.createQueryBuilder('u').orderBy('u.id', 'DESC')
    if (params.keyword) {
      qb.where('u.nickname LIKE :kw OR u.gameId LIKE :kw', { kw: `%${params.keyword}%` })
    }
    const [list, total] = await qb
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getManyAndCount()
    return { list: list.map(toUserVO), total }
  }

  async toggleBan(id: number): Promise<User> {
    const user = await this.findByIdOrFail(id)
    user.banned = !user.banned
    return this.userRepo.save(user)
  }

  createByAdmin(data: { nickname: string; gameId?: string }): Promise<User> {
    return this.create({
      openid: 'admin_created_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nickname: data.nickname,
      gameId: data.gameId || ''
    })
  }

  /** 累计消费（分） */
  async addSpend(id: number, amount: number): Promise<void> {
    await this.userRepo.increment({ id }, 'totalSpend', amount)
  }

  /** 订单数 +1 */
  async incrementOrderCount(id: number): Promise<void> {
    await this.userRepo.increment({ id }, 'orderCount', 1)
  }

  /** 订单数 -1（已完成订单退款时），不小于 0 */
  async decrementOrderCount(id: number): Promise<void> {
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ orderCount: () => 'GREATEST(order_count - 1, 0)' })
      .where('id = :id', { id })
      .execute()
  }

  /** 是否被封禁 */
  async isBanned(id: number): Promise<boolean> {
    const user = await this.findById(id)
    return !!user && user.banned
  }

  /** 扣减余额（不足返回 false，不扣） */
  async deductBalance(id: number, amount: number): Promise<boolean> {
    const user = await this.findByIdOrFail(id)
    if (user.balance < amount) return false
    user.balance -= amount
    await this.userRepo.save(user)
    return true
  }

  /** 增加余额（充值/兑换） */
  async addBalance(id: number, amount: number): Promise<User> {
    const user = await this.findByIdOrFail(id)
    user.balance += amount
    return this.userRepo.save(user)
  }

  /** 删除用户（级联删除其订单；若为打手，同时删除其打手档案，避免孤儿互相影响） */
  async remove(id: number): Promise<{ ok: boolean }> {
    const user = await this.findByIdOrFail(id)
    // 若该用户是打手，删除其打手档案
    if (user.boosterId) {
      await this.boosterRepo.delete(user.boosterId)
    }
    await this.orderRepo.delete({ userId: id })
    await this.userRepo.delete(id)
    return { ok: true }
  }

  /** 批量删除用户（级联删除其订单与打手档案） */
  async batchRemove(ids: number[]): Promise<{ ok: boolean }> {
    if (!ids || !ids.length) throw new BadRequestException('请选择要删除的用户')
    const users = await this.userRepo.find({ where: { id: In(ids) } })
    const boosterIds = users
      .map((u) => u.boosterId)
      .filter((id): id is number => id !== null)
    if (boosterIds.length) await this.boosterRepo.delete(boosterIds)
    await this.orderRepo.delete({ userId: In(ids) })
    await this.userRepo.delete(ids)
    return { ok: true }
  }
}
