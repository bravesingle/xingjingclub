import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Banner } from './banner.entity'
import { GameService } from '../services/service.entity'
import { RedisService } from '../../redis/redis.service'

const HOME_CACHE_KEY = 'cache:home:data'

/** Banner 对外 VO（时间戳统一 number） */
function toBannerVO(b: Banner) {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    cover: b.cover,
    gradient: b.gradient,
    linkType: b.linkType,
    linkId: b.linkId,
    sort: b.sort,
    createdAt: b.createdAt ? new Date(b.createdAt).getTime() : null
  }
}

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepo: Repository<Banner>,
    @InjectRepository(GameService)
    private readonly serviceRepo: Repository<GameService>,
    private readonly redis: RedisService
  ) {}

  /** 小程序首页用：全部 banner（按 sort 升序） */
  async listForUser(): Promise<ReturnType<typeof toBannerVO>[]> {
    const list = await this.bannerRepo.find({ order: { sort: 'ASC', id: 'ASC' } })
    return list.map(toBannerVO)
  }

  /** 管理后台：列表 */
  async adminList(): Promise<ReturnType<typeof toBannerVO>[]> {
    const list = await this.bannerRepo.find({ order: { sort: 'ASC', id: 'ASC' } })
    return list.map(toBannerVO)
  }

  /** 添加 Banner：可关联已有商品（自动取封面图/渐变/标题）或自定义 */
  async create(dto: {
    title?: string
    subtitle?: string
    cover?: string
    gradient?: string
    linkType?: string
    linkId?: string
    serviceId?: number
    sort?: number
  }) {
    let title = (dto.title || '').trim()
    let subtitle = (dto.subtitle || '').trim()
    let cover = (dto.cover || '').trim()
    let gradient = (dto.gradient || '').trim()
    let linkType = dto.linkType || 'service'
    let linkId = String(dto.linkId || '')

    // 关联已有商品：自动填充封面/渐变/标题，并跳转到该商品
    if (dto.serviceId) {
      const svc = await this.serviceRepo.findOne({ where: { id: dto.serviceId } })
      if (!svc) throw new BadRequestException('商品不存在')
      linkType = 'service'
      linkId = String(svc.id)
      if (!title) title = svc.title
      if (!subtitle) subtitle = svc.subtitle
      if (!cover) cover = svc.cover || ''
      if (!gradient) gradient = svc.coverGradient || ''
    }

    if (!title) throw new BadRequestException('Banner 标题不能为空')

    const banner = this.bannerRepo.create({
      title,
      subtitle,
      cover,
      gradient,
      linkType,
      linkId,
      sort: Number(dto.sort) || 0
    })
    const saved = await this.bannerRepo.save(banner)
    await this.redis.del(HOME_CACHE_KEY)
    return toBannerVO(saved)
  }

  /** 删除 Banner */
  async remove(id: number) {
    const banner = await this.bannerRepo.findOne({ where: { id } })
    if (!banner) throw new BadRequestException('Banner 不存在')
    await this.bannerRepo.delete(id)
    await this.redis.del(HOME_CACHE_KEY)
    return { ok: true }
  }
}
