import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { RedisService } from '../../redis/redis.service'

/**
 * 微信手机号快速验证服务
 *
 * 流程：小程序端 <button open-type="getPhoneNumber"> 拿到 code（phoneCode）
 *      → 本服务用 access_token 调微信 getuserphonenumber 换取真实手机号
 *
 * 前提（小程序后台配置）：
 *  1. 已开通「手机号快速验证」能力（按次计费）
 *  2. 服务器公网 IP 已加入「开发管理-开发设置-IP白名单」（否则 access_token 获取失败）
 */
@Injectable()
export class WechatPhoneService {
  private readonly logger = new Logger('WechatPhone')
  private static readonly TOKEN_CACHE_KEY = 'wx:access_token'

  constructor(private readonly redis: RedisService) {}

  /** 获取 access_token（Redis 缓存，微信有效期 7200s，这里缓存 7000s） */
  private async getAccessToken(forceRefresh = false): Promise<string> {
    const appid = process.env.WECHAT_APPID || ''
    const secret = process.env.WECHAT_SECRET || ''
    if (!appid || !secret) {
      throw new BadRequestException('未配置 WECHAT_APPID / WECHAT_SECRET，无法获取手机号')
    }
    if (!forceRefresh) {
      const cached = await this.redis.get<string>(WechatPhoneService.TOKEN_CACHE_KEY)
      if (cached) return cached
    }
    const url =
      'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' +
      appid +
      '&secret=' +
      secret
    const res = await fetch(url).then((r) => r.json() as Promise<any>)
    if (!res.access_token) {
      this.logger.error('获取 access_token 失败: ' + (res.errmsg || JSON.stringify(res)))
      throw new BadRequestException(
        '获取微信 access_token 失败：' + (res.errmsg || res.errcode || '未知错误') +
          '（请确认服务器 IP 已加入微信后台 IP 白名单）'
      )
    }
    await this.redis.set(WechatPhoneService.TOKEN_CACHE_KEY, res.access_token, 7000)
    return res.access_token as string
  }

  /**
   * 用 getPhoneNumber 返回的 code 换取手机号
   * @param phoneCode 小程序 getPhoneNumber 回调里的 e.detail.code
   */
  async getPhoneNumber(phoneCode: string): Promise<string> {
    if (!phoneCode) throw new BadRequestException('缺少手机号授权 code')
    let token = await this.getAccessToken()
    let res = await this.requestPhone(token, phoneCode)
    // access_token 失效（40001/42001）→ 强制刷新后重试一次
    if (res.errcode === 40001 || res.errcode === 42001) {
      token = await this.getAccessToken(true)
      res = await this.requestPhone(token, phoneCode)
    }
    if (res.errcode !== 0 || !res.phone_info) {
      this.logger.error('获取手机号失败: ' + (res.errmsg || JSON.stringify(res)))
      throw new BadRequestException('获取手机号失败：' + (res.errmsg || res.errcode || '未知错误'))
    }
    const info = res.phone_info
    return info.purePhoneNumber || info.phoneNumber
  }

  private async requestPhone(token: string, phoneCode: string): Promise<any> {
    const url = 'https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=' + token
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: phoneCode })
    }).then((r) => r.json() as Promise<any>)
  }
}
