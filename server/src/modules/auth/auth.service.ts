import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { createHash } from 'crypto'
import { UsersService } from '../users/users.service'
import { User } from '../users/user.entity'
import { toUserVO } from '../users/user.vo'
import { Booster } from '../boosters/booster.entity'
import { WechatLoginDto } from './dto/wechat-login.dto'
import { WechatPhoneLoginDto } from './dto/wechat-phone-login.dto'
import { WechatPhoneService } from './wechat-phone.service'
import { ApplyBoosterDto } from './dto/apply-booster.dto'
import { CATEGORY_NAME_MAP } from '../services/services.constants'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly wechatPhone: WechatPhoneService,
    @InjectRepository(Booster)
    private readonly boosterRepo: Repository<Booster>
  ) {}

  /**
   * 微信一键登录（推荐）：手机号快速验证 code 换真实手机号 + wx.login code 换 openid
   * 用户无需手填手机号，复用 wechatLogin 的建号与角色绑定逻辑
   */
  async wechatLoginWithPhone(
    dto: WechatPhoneLoginDto
  ): Promise<{ token: string; userInfo: ReturnType<typeof toUserVO> }> {
    const phone = await this.wechatPhone.getPhoneNumber(dto.phoneCode)
    return this.wechatLogin({
      code: dto.code,
      nickname: dto.nickname,
      gameId: dto.gameId,
      phone
    } as WechatLoginDto)
  }

  /**
   * 微信登录（wx.login code 换 openid）
   * - WECHAT_MOCK=true 时 openid 由 code 本地派生；否则请求微信 jscode2session
   * - 手机号绑定身份：phone 命中已审核打手 → role=booster，否则 player
   */
  async wechatLogin(dto: WechatLoginDto): Promise<{ token: string; userInfo: ReturnType<typeof toUserVO> }> {
    // mock 模式（WECHAT_MOCK=true）：允许手机号锚定已有用户（开发期无真实 openid）
    // 真实模式（WECHAT_MOCK=false）：强制用 wx.login code 换真实 openid，手机号仅用于打手角色识别，
    // 不锚定旧用户，避免命中 mock/seed 假用户导致永远拿不到真实 openid（微信支付依赖真实 openid）
    const mockMode = process.env.WECHAT_MOCK === 'true'
    if (mockMode && dto.phone) {
      // 1) 打手手机号：命中已审核打手 → 一定是打手身份
      const booster = await this.boosterRepo.findOne({ where: { phone: dto.phone, audit: 'approved' } })
      if (booster && booster.userId) {
        const bound = await this.usersService.findById(booster.userId)
        if (bound) {
          if (bound.banned) throw new ForbiddenException('账号已被封禁')
          const patch: Partial<User> = {}
          if (dto.nickname && dto.nickname.trim()) patch.nickname = dto.nickname.trim()
          if (dto.gameId && dto.gameId.trim()) patch.gameId = dto.gameId.trim()
          // 确保绑定用户确为打手身份
          if (bound.role !== 'booster' || bound.boosterId !== booster.id) {
            patch.role = 'booster'
            patch.boosterId = booster.id
          }
          if (Object.keys(patch).length) await this.usersService.update(bound.id, patch)
          const token = this.jwtService.sign({ userId: bound.id, role: 'user', openid: bound.openid })
          return { token, userInfo: toUserVO(await this.usersService.findByIdOrFail(bound.id)) }
        }
      }
      // 2) 普通用户锚点（仅 mock 模式）：命中非打手已有用户 → 直接登录
      if (!booster) {
        const userByPhone = await this.usersService.findByPhone(dto.phone)
        if (userByPhone && userByPhone.role !== 'booster') {
          if (userByPhone.banned) throw new ForbiddenException('账号已被封禁')
          const patch: Partial<User> = {}
          if (dto.nickname && dto.nickname.trim()) patch.nickname = dto.nickname.trim()
          if (dto.gameId && dto.gameId.trim()) patch.gameId = dto.gameId.trim()
          if (Object.keys(patch).length) await this.usersService.update(userByPhone.id, patch)
          const token = this.jwtService.sign({ userId: userByPhone.id, role: 'user', openid: userByPhone.openid })
          return { token, userInfo: toUserVO(userByPhone) }
        }
      }
    }

    const openid = await this.resolveOpenid(dto.code)

    let user = await this.usersService.findByOpenid(openid)
    if (!user) {
      const roleInfo = await this.resolveRole(dto.phone)
      user = await this.usersService.create({
        openid,
        nickname: (dto.nickname || '').trim() || '星竞玩家',
        gameId: (dto.gameId || '').trim(),
        phone: dto.phone || '',
        role: roleInfo.role,
        boosterId: roleInfo.boosterId
      })
      // 绑定打手档案的用户
      if (roleInfo.boosterId) {
        await this.boosterRepo.update(roleInfo.boosterId, { userId: user.id })
      }
    } else {
      if (user.banned) throw new ForbiddenException('账号已被封禁')
      const patch: Partial<User> = {}
      if (dto.nickname && dto.nickname.trim()) patch.nickname = dto.nickname.trim()
      if (dto.gameId && dto.gameId.trim()) patch.gameId = dto.gameId.trim()
      // 手机号识别身份：每次登录都按手机号重新核对（误生成 player 也能升级为打手）
      if (dto.phone) {
        patch.phone = dto.phone
        const booster = await this.boosterRepo.findOne({ where: { phone: dto.phone, audit: 'approved' } })
        if (booster && (user.role !== 'booster' || user.boosterId !== booster.id)) {
          patch.role = 'booster'
          patch.boosterId = booster.id
          await this.boosterRepo.update(booster.id, { userId: user.id })
        }
      }
      if (Object.keys(patch).length) user = await this.usersService.update(user.id, patch)
    }

    const token = this.jwtService.sign({ userId: user.id, role: 'user', openid })
    return { token, userInfo: toUserVO(user) }
  }

  /**
   * 打手入驻申请：创建待审核打手档案（手机号绑定当前用户）
   * 审核通过后该手机号登录即识别为打手
   */
  async applyBooster(userId: number, dto: ApplyBoosterDto) {
    const user = await this.usersService.findByIdOrFail(userId)
    // 手机号已存在已审核打手 → 拒绝
    const existed = await this.boosterRepo.findOne({ where: { phone: dto.phone } })
    if (existed && existed.audit !== 'rejected') {
      throw new BadRequestException('该手机号已提交过入驻申请')
    }
    const categories = dto.categories || ['rank']
    const booster = this.boosterRepo.create({
      name: dto.name,
      phone: dto.phone,
      userId,
      categories,
      categoryNames: categories.map((c) => CATEGORY_NAME_MAP[c] || c),
      mode: dto.mode || 'hazard',
      rank: dto.rank || '少尉',
      rating: 5,
      orderCount: 0,
      online: false,
      accepting: false,
      audit: 'pending',
      deposited: false,
      withdrawChannel: dto.withdrawChannel || 'wechat',
      withdrawAccount: dto.withdrawAccount || '',
      joinedAt: Date.now(),
      remark: dto.remark || '用户入驻申请'
    })
    const saved = await this.boosterRepo.save(booster)
    // 记录用户手机号
    if (!user.phone) await this.usersService.update(user.id, { phone: dto.phone })
    return { id: saved.id, name: saved.name, audit: saved.audit }
  }

  /** 手机号识别角色：命中已审核打手 → booster */
  private async resolveRole(phone?: string): Promise<{ role: string; boosterId: number | null }> {
    if (!phone) return { role: 'player', boosterId: null }
    const booster = await this.boosterRepo.findOne({ where: { phone, audit: 'approved' } })
    if (booster) return { role: 'booster', boosterId: booster.id }
    return { role: 'player', boosterId: null }
  }

  private async resolveOpenid(code: string): Promise<string> {
    const appid = process.env.WECHAT_APPID || ''
    const secret = process.env.WECHAT_SECRET || ''
    const mock = process.env.WECHAT_MOCK === 'true' || !appid || !secret
    if (mock) {
      return 'mock_' + createHash('md5').update(code || 'anonymous').digest('hex').slice(0, 24)
    }
    const url =
      'https://api.weixin.qq.com/sns/jscode2session?appid=' +
      appid + '&secret=' + secret + '&js_code=' + encodeURIComponent(code) + '&grant_type=authorization_code'
    const res = await fetch(url).then((r) => r.json())
    if (!res.openid) {
      throw new BadRequestException('微信登录失败: ' + (res.errmsg || 'code 无效'))
    }
    return res.openid
  }
}
