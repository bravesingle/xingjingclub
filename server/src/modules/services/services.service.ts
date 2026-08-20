import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { GameService } from './service.entity'
import { ServiceSpec } from './service-spec.entity'
import { toServiceVO } from './service.vo'
import { RedisService } from '../../redis/redis.service'
import {
  BANNERS,
  CATEGORIES,
  CATEGORY_NAME_MAP,
  MODE_NAME_MAP,
  SPEC_DISCOUNT
} from './services.constants'
import { CreateServiceDto, QueryServicesDto, UpdateServiceDto } from './dto/service.dto'

const HOME_CACHE_KEY = 'cache:home:data'
const HOME_CACHE_TTL = 60

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(GameService)
    private readonly serviceRepo: Repository<GameService>,
    @InjectRepository(ServiceSpec)
    private readonly specRepo: Repository<ServiceSpec>,
    private readonly redis: RedisService
  ) {}

  /* ============ 规格生成（与前端折扣逻辑一致） ============ */

  buildSpecs(priceUnit: string, basePrice: number): ServiceSpec[] {
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
      const discount = SPEC_DISCOUNT[s.value] || 1
      const spec = new ServiceSpec()
      spec.value = s.value
      spec.label = s.label
      spec.price = Math.round(basePrice * s.value * discount)
      return spec
    })
  }

  /* ============ 小程序端 ============ */

  /** 首页聚合：banner + 分类 + 热门服务（Redis 缓存 60s） */
  async getHomeData() {
    const cached = await this.redis.get<any>(HOME_CACHE_KEY)
    if (cached) return cached

    // 热门 = 销量前 4 + 最新上架补齐到 6（保证后台新上架商品首页可见）
    const topSales = await this.serviceRepo.find({
      where: { isOnSale: true },
      relations: { specs: true },
      order: { sales: 'DESC', id: 'DESC' },
      take: 4
    })
    const topIds = new Set(topSales.map((s) => s.id))
    const newest = await this.serviceRepo.find({
      where: { isOnSale: true },
      relations: { specs: true },
      order: { id: 'DESC' },
      take: 8
    })
    const hot = topSales.slice()
    for (const s of newest) {
      if (!topIds.has(s.id) && hot.length < 6) hot.push(s)
    }

    const data = {
      banners: BANNERS,
      categories: CATEGORIES,
      hotServices: hot.map(toServiceVO)
    }
    await this.redis.set(HOME_CACHE_KEY, data, HOME_CACHE_TTL)
    return data
  }

  /** 服务列表（仅上架，小程序端） */
  async listForUser(params: QueryServicesDto) {
    const qb = this.serviceRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.specs', 'spec')
      .where('s.is_on_sale = :on', { on: true })
    if (params.category && params.category !== 'all') {
      qb.andWhere('s.category = :category', { category: params.category })
    }
    if (params.mode && params.mode !== 'all') {
      qb.andWhere('s.mode = :mode', { mode: params.mode })
    }
    if (params.keyword) {
      qb.andWhere('(s.title LIKE :kw OR s.subtitle LIKE :kw)', { kw: `%${params.keyword}%` })
    }
    const sort = params.sort || 'sales'
    // 注意：orderBy 必须使用实体属性名（camelCase），用数据库列名会触发 TypeORM 排序 bug
    if (sort === 'price_asc') qb.orderBy('s.basePrice', 'ASC').addOrderBy('s.id', 'ASC')
    else if (sort === 'price_desc') qb.orderBy('s.basePrice', 'DESC').addOrderBy('s.id', 'ASC')
    else qb.orderBy('s.sales', 'DESC').addOrderBy('s.id', 'ASC')

    const [list, total] = await qb
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getManyAndCount()
    return { list: list.map(toServiceVO), total }
  }

  /** 服务详情（仅上架，小程序端；下架视为不存在） */
  async getForUser(id: number) {
    const service = await this.serviceRepo.findOne({
      where: { id, isOnSale: true },
      relations: { specs: true }
    })
    if (!service) throw new NotFoundException('服务不存在或已下架')
    return toServiceVO(service)
  }

  /* ============ 管理端 ============ */

  async adminList(params: { keyword?: string; page: number; pageSize: number; onSale?: boolean }) {
    const qb = this.serviceRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.specs', 'spec')
      .orderBy('s.id', 'DESC')
    if (params.keyword) {
      qb.where('(s.title LIKE :kw OR s.subtitle LIKE :kw)', { kw: `%${params.keyword}%` })
    }
    if (params.onSale !== undefined) {
      qb.andWhere('s.is_on_sale = :on', { on: params.onSale })
    }
    const [list, total] = await qb
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getManyAndCount()
    return { list: list.map(toServiceVO), total }
  }

  async findById(id: number): Promise<GameService> {
    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: { specs: true }
    })
    if (!service) throw new NotFoundException('服务不存在')
    return service
  }

  async create(dto: CreateServiceDto): Promise<GameService> {
    const service = this.serviceRepo.create({
      title: dto.title,
      subtitle: dto.subtitle || '',
      category: dto.category,
      categoryName: CATEGORY_NAME_MAP[dto.category] || dto.category,
      mode: dto.mode,
      modeName: MODE_NAME_MAP[dto.mode] || dto.mode,
      priceUnit: dto.priceUnit,
      unitName: dto.priceUnit === 'match' ? '局' : '小时',
      basePrice: dto.basePrice,
      coverText: dto.coverText || dto.title.slice(0, 6),
      cover: dto.cover || '',
      tags: dto.tags || [],
      serviceRules: [
        '下单后请添加客服微信确认游戏区服与上线时间；',
        '陪玩过程中请保持语音沟通，便于带队指挥；'
      ],
      notice: ['订单支付后不支持改单，请确认服务规格后下单；', '服务未开始前可申请全额退款；'],
      isOnSale: true,
      sales: 0,
      rating: 5,
      specs: []
    })
    service.specs = this.buildSpecs(service.priceUnit, service.basePrice)
    const saved = await this.serviceRepo.save(service)
    await this.invalidateCache()
    return saved
  }

  async update(id: number, dto: UpdateServiceDto): Promise<GameService> {
    const service = await this.findById(id)
    if (dto.title !== undefined) service.title = dto.title
    if (dto.subtitle !== undefined) service.subtitle = dto.subtitle
    if (dto.category !== undefined) {
      service.category = dto.category
      service.categoryName = CATEGORY_NAME_MAP[dto.category] || dto.category
    }
    if (dto.mode !== undefined) {
      service.mode = dto.mode
      service.modeName = MODE_NAME_MAP[dto.mode] || dto.mode
    }
    if (dto.priceUnit !== undefined) service.priceUnit = dto.priceUnit
    if (dto.basePrice !== undefined) service.basePrice = dto.basePrice
    if (dto.tags !== undefined) service.tags = dto.tags
    if (dto.coverText !== undefined) service.coverText = dto.coverText
    if (dto.cover !== undefined) service.cover = dto.cover
    if (dto.rating !== undefined) service.rating = dto.rating
    service.unitName = service.priceUnit === 'match' ? '局' : '小时'
    // 计价方式或起步价变化 → 重建规格
    // 注意：必须先显式删除旧规格，否则 TypeORM 集合移除会把外键置 NULL（NOT NULL 列报错）
    if (dto.priceUnit !== undefined || dto.basePrice !== undefined) {
      await this.specRepo.delete({ serviceId: service.id })
      service.specs = this.buildSpecs(service.priceUnit, service.basePrice)
    }
    const saved = await this.serviceRepo.save(service)
    await this.invalidateCache()
    return saved
  }

  async toggleOnSale(id: number): Promise<GameService> {
    const service = await this.findById(id)
    service.isOnSale = !service.isOnSale
    const saved = await this.serviceRepo.save(service)
    await this.invalidateCache()
    return saved
  }

  async remove(id: number): Promise<void> {
    await this.findById(id)
    await this.serviceRepo.delete(id)
    await this.specRepo.delete({ serviceId: id })
    await this.invalidateCache()
  }

  /** 批量删除服务（含规格，清缓存） */
  async batchRemove(ids: number[]): Promise<{ ok: boolean }> {
    if (!ids || !ids.length) throw new BadRequestException('请选择要删除的服务')
    await this.specRepo.delete({ serviceId: In(ids) })
    await this.serviceRepo.delete(ids)
    await this.invalidateCache()
    return { ok: true }
  }

  private async invalidateCache(): Promise<void> {
    await this.redis.del(HOME_CACHE_KEY)
  }
}
