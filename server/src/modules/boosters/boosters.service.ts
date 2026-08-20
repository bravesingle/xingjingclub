import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Booster } from './booster.entity'
import { toBoosterVO } from './booster.vo'
import { CreateBoosterDto, UpdateBoosterDto } from './dto/booster.dto'
import { CATEGORY_NAME_MAP } from '../services/services.constants'
import { User } from '../users/user.entity'
import { Deposit } from '../fund/deposit.entity'
import { Income } from '../fund/income.entity'
import { Withdrawal } from '../fund/withdrawal.entity'

@Injectable()
export class BoostersService {
  constructor(
    @InjectRepository(Booster)
    private readonly boosterRepo: Repository<Booster>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
    @InjectRepository(Income)
    private readonly incomeRepo: Repository<Income>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>
  ) {}

  /** 小程序端：可接单打手列表（已审核 + 在线，P2 打手模块使用） */
  async listForUser() {
    const list = await this.boosterRepo.find({
      where: { audit: 'approved', online: true },
      order: { rating: 'DESC' }
    })
    return list.map(toBoosterVO)
  }

  /** 管理端列表 */
  async adminList(params: { status?: string; keyword?: string; page: number; pageSize: number }) {
    const qb = this.boosterRepo.createQueryBuilder('b').orderBy('b.id', 'DESC')
    if (params.status && params.status !== 'all') {
      qb.where('b.audit = :audit', { audit: params.status })
    }
    if (params.keyword) {
      qb.andWhere('(b.name LIKE :kw OR b.remark LIKE :kw)', { kw: `%${params.keyword}%` })
    }
    const [list, total] = await qb
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getManyAndCount()
    return { list: list.map(toBoosterVO), total }
  }

  async create(dto: CreateBoosterDto) {
    const categories = dto.categories || ['rank']
    const booster = this.boosterRepo.create({
      name: dto.name,
      phone: dto.phone || '',
      categories,
      categoryNames: categories.map((c) => CATEGORY_NAME_MAP[c] || c),
      mode: dto.mode || 'hazard',
      rank: dto.rank || '少尉',
      rating: dto.rating ?? 5,
      orderCount: 0,
      online: false,
      accepting: false,
      // 后台添加默认待审核，可选 approved 立即生效；入驻申请仍 pending 需审核
      audit: dto.audit || 'pending',
      deposited: false,
      withdrawChannel: dto.withdrawChannel || 'wechat',
      withdrawAccount: dto.withdrawAccount || '',
      joinedAt: Date.now(),
      remark: dto.remark || ''
    })
    const saved = await this.boosterRepo.save(booster)
    return toBoosterVO(saved)
  }

  async update(id: number, dto: UpdateBoosterDto) {
    const booster = await this.findById(id)
    if (dto.audit !== undefined) {
      const wasApproved = booster.audit === 'approved'
      booster.audit = dto.audit
      // 审核通过且已绑定用户（入驻申请流程）→ 升级用户为打手身份
      if (dto.audit === 'approved' && !wasApproved && booster.userId) {
        await this.userRepo.update(booster.userId, { role: 'booster', boosterId: booster.id })
      }
    }
    if (dto.phone !== undefined) booster.phone = dto.phone
    if (dto.online !== undefined) {
      booster.online = dto.online
      if (!dto.online) booster.accepting = false // 下线自动停止接单
    }
    if (dto.accepting !== undefined) booster.accepting = dto.accepting
    if (dto.deposited !== undefined) booster.deposited = dto.deposited
    if (dto.withdrawChannel !== undefined) booster.withdrawChannel = dto.withdrawChannel
    if (dto.withdrawAccount !== undefined) booster.withdrawAccount = dto.withdrawAccount
    if (dto.rank !== undefined) booster.rank = dto.rank
    if (dto.rating !== undefined) booster.rating = dto.rating
    if (dto.remark !== undefined) booster.remark = dto.remark
    const saved = await this.boosterRepo.save(booster)
    return toBoosterVO(saved)
  }

  /** 统计（Dashboard） */
  async stats() {
    const list = await this.boosterRepo.find()
    return {
      total: list.length,
      pending: list.filter((b) => b.audit === 'pending').length,
      online: list.filter((b) => b.online).length,
      accepting: list.filter((b) => b.online && b.accepting).length,
      totalOrders: list.reduce((sum, b) => sum + (b.orderCount || 0), 0)
    }
  }

  /** 删除打手（同时解除关联用户身份 + 级联删除押金/收入/提现记录） */
  async remove(id: number): Promise<{ ok: boolean }> {
    await this.findById(id)
    await this.boosterRepo.delete(id)
    // 解除用户绑定：booster_id 置空 + 角色回 player
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ boosterId: null, role: 'player' })
      .where('booster_id = :id', { id })
      .execute()
    // 级联删除资金记录
    await this.depositRepo.delete({ boosterId: id })
    await this.incomeRepo.delete({ boosterId: id })
    await this.withdrawalRepo.delete({ boosterId: id })
    return { ok: true }
  }

  /** 批量删除打手（同时解除关联用户身份 + 级联删除资金记录） */
  async batchRemove(ids: number[]): Promise<{ ok: boolean }> {
    if (!ids || !ids.length) throw new BadRequestException('请选择要删除的打手')
    await this.boosterRepo.delete(ids)
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ boosterId: null, role: 'player' })
      .where('booster_id IN (:...ids)', { ids })
      .execute()
    await this.depositRepo
      .createQueryBuilder()
      .delete()
      .where('booster_id IN (:...ids)', { ids })
      .execute()
    await this.incomeRepo
      .createQueryBuilder()
      .delete()
      .where('booster_id IN (:...ids)', { ids })
      .execute()
    await this.withdrawalRepo
      .createQueryBuilder()
      .delete()
      .where('booster_id IN (:...ids)', { ids })
      .execute()
    return { ok: true }
  }

  private async findById(id: number): Promise<Booster> {
    const booster = await this.boosterRepo.findOne({ where: { id } })
    if (!booster) throw new NotFoundException('打手不存在')
    return booster
  }
}
