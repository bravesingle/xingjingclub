import { BadRequestException, Logger } from '@nestjs/common'
import { createPrivateKey, createPublicKey, createDecipheriv, randomBytes, sign, verify } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * 微信支付 APIv3 客户端（直连商户 JSAPI）
 *
 * 环境变量（server/.env）：
 *   WXPAY_MCHID         商户号（直连商户号）
 *   WXPAY_SERIAL_NO     商户 API 证书序列号
 *   WXPAY_APIV3_KEY     APIv3 密钥（32位，回调解密用）
 *   WXPAY_PRIVATE_KEY   商户证书私钥文件路径（默认 certs/apiclient_key.pem，相对 server/ 运行目录）
 *   WXPAY_PUBLIC_KEY    微信支付平台公钥文件路径（默认 certs/wechatpay_pub.pem，回调验签用）
 *   WXPAY_PUB_KEY_ID    微信支付平台公钥ID（可选，用于校验回调 Wechatpay-Serial）
 *   WXPAY_NOTIFY_URL    支付结果回调完整地址，如 https://api.xingjingclub.cn/api/pay/wechat/notify
 *
 * 参考官方文档：https://pay.weixin.qq.com/doc/v3/merchant/4012791855
 */
export class WechatPayClient {
  private readonly logger = new Logger('WechatPay')
  private readonly mchid: string
  private readonly serialNo: string
  private readonly apiv3Key: string
  private readonly privateKeyPem: string
  private readonly publicKeyPem: string
  private readonly pubKeyId: string
  private readonly notifyUrl: string
  private readonly base = 'https://api.mch.weixin.qq.com'

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const mchid = env.WXPAY_MCHID || ''
    const serialNo = env.WXPAY_SERIAL_NO || ''
    const apiv3Key = env.WXPAY_APIV3_KEY || ''
    const privateKeyPath = env.WXPAY_PRIVATE_KEY || 'certs/apiclient_key.pem'
    const publicKeyPath = env.WXPAY_PUBLIC_KEY || 'certs/wechatpay_pub.pem'
    const notifyUrl = env.WXPAY_NOTIFY_URL || ''

    const missing = [
      ['WXPAY_MCHID', mchid],
      ['WXPAY_SERIAL_NO', serialNo],
      ['WXPAY_APIV3_KEY', apiv3Key],
      ['WXPAY_NOTIFY_URL', notifyUrl]
    ]
      .filter(([, v]) => !v)
      .map(([k]) => k)
    if (missing.length) {
      throw new Error('微信支付配置缺失: ' + missing.join(', ') + '（请在 server/.env 配置，或将 PAY_MOCK 保持 true）')
    }

    // 私钥/公钥文件不存在时给出明确路径提示（不上传证书时仍可用 mock 模式）
    const pkAbs = join(process.cwd(), privateKeyPath)
    const pubAbs = join(process.cwd(), publicKeyPath)
    try {
      this.privateKeyPem = readFileSync(pkAbs, 'utf8')
    } catch {
      throw new Error(`微信支付商户私钥文件读取失败: ${pkAbs}（PAY_MOCK=false 时必须存在 apiclient_key.pem）`)
    }
    try {
      this.publicKeyPem = readFileSync(pubAbs, 'utf8')
    } catch {
      throw new Error(`微信支付平台公钥文件读取失败: ${pubAbs}（PAY_MOCK=false 时必须存在 wechatpay_pub.pem）`)
    }

    this.mchid = mchid
    this.serialNo = serialNo
    this.apiv3Key = apiv3Key
    this.notifyUrl = notifyUrl
    this.pubKeyId = env.WXPAY_PUB_KEY_ID || ''
  }

  /** RSA-SHA256 签名（商户私钥），返回 base64 */
  private sign(message: string): string {
    return sign('RSA-SHA256', Buffer.from(message, 'utf8'), this.privateKeyPem).toString('base64')
  }

  /** 构造请求 Authorization 头（WECHATPAY2-SHA256-RSA2048） */
  private authHeader(method: string, urlPath: string, bodyStr: string): string {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = randomBytes(16).toString('hex')
    const message = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${bodyStr}\n`
    const signature = this.sign(message)
    return (
      'WECHATPAY2-SHA256-RSA2048 mchid="' +
      this.mchid +
      '",nonce_str="' +
      nonce +
      '",signature="' +
      signature +
      '",timestamp="' +
      timestamp +
      '",serial_no="' +
      this.serialNo +
      '"'
    )
  }

  /** 通用 APIv3 请求（自动签名，返回 JSON data） */
  private async request<T = any>(method: 'GET' | 'POST', urlPath: string, body?: object): Promise<T> {
    const bodyStr = body ? JSON.stringify(body) : ''
    const res = await fetch(this.base + urlPath, {
      method,
      headers: {
        Authorization: this.authHeader(method, urlPath, bodyStr),
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'xingjing-esports/1.0.0'
      },
      body: method === 'POST' && body ? bodyStr : undefined
    })
    const text = await res.text()
    const data = text ? JSON.parse(text) : {}
    if (!res.ok || data.code) {
      // 微信错误结构：{ code, message, detail }
      const msg = data.message || data.code || `HTTP ${res.status}`
      throw new BadRequestException(`微信支付请求失败: ${msg}`)
    }
    return data as T
  }

  /**
   * JSAPI 统一下单
   * @param params.attach 附加数据（随回调原样返回，用于区分业务类型，如 'deposit' 保证金）
   * @returns prepay_id
   */
  async jsapiPrepay(params: {
    appid: string
    description: string
    outTradeNo: string
    amountFen: number
    openid: string
    attach?: string
  }): Promise<string> {
    const body: Record<string, any> = {
      appid: params.appid,
      mchid: this.mchid,
      description: params.description.slice(0, 127),
      out_trade_no: params.outTradeNo,
      notify_url: this.notifyUrl,
      amount: { total: params.amountFen, currency: 'CNY' },
      payer: { openid: params.openid }
    }
    if (params.attach) body.attach = params.attach.slice(0, 127)
    const data = await this.request<{ prepay_id: string }>('POST', '/v3/pay/transactions/jsapi', body)
    if (!data.prepay_id) throw new BadRequestException('微信下单失败: 未返回 prepay_id')
    return data.prepay_id
  }

  /**
   * 微信支付退款（V3 退款）
   * @param params outTradeNo 原商户订单号；amountFen 订单金额；refundFen 退款金额；reason 退款原因
   * @returns 微信退款单号 refund_id（成功时 status 为 PROCESSING/SUCCESS）
   */
  async refund(params: {
    outTradeNo: string
    amountFen: number
    refundFen: number
    reason?: string
  }): Promise<{ refund_id: string; status: string; out_refund_no: string }> {
    const outRefundNo = 'RF' + Date.now().toString(36).toUpperCase() + randomBytes(4).toString('hex').toUpperCase()
    const data = await this.request<{ refund_id: string; status: string; out_refund_no: string }>(
      'POST',
      '/v3/refund/domestic/refunds',
      {
        out_trade_no: params.outTradeNo,
        out_refund_no: outRefundNo,
        reason: (params.reason || '用户申请退款').slice(0, 80),
        amount: {
          refund: params.refundFen,
          total: params.amountFen,
          currency: 'CNY'
        }
      }
    )
    if (!data.refund_id) throw new BadRequestException('微信退款失败: 未返回 refund_id')
    return data
  }

  /**
   * 组装小程序 wx.requestPayment 参数
   * paySign = RSA-SHA256(appid\ntimeStamp\nnonceStr\npackage\n)
   */
  buildMiniPayParams(appid: string, prepayId: string): MiniPayParams {
    const timeStamp = Math.floor(Date.now() / 1000).toString()
    const nonceStr = randomBytes(16).toString('hex')
    const pkg = 'prepay_id=' + prepayId
    const message = `${appid}\n${timeStamp}\n${nonceStr}\n${pkg}\n`
    return {
      timeStamp,
      nonceStr,
      package: pkg,
      signType: 'RSA',
      paySign: this.sign(message)
    }
  }

  /**
   * 校验回调签名并解密 resource（AES-256-GCM）
   * 微信回调头：Wechatpay-Timestamp / Wechatpay-Nonce / Wechatpay-Signature / Wechatpay-Serial
   */
  verifyAndDecryptNotify(headers: Record<string, any>, rawBody: string): NotifyResult {
    const timestamp = headers['wechatpay-timestamp']
    const nonce = headers['wechatpay-nonce']
    const signature = headers['wechatpay-signature']
    const serial = headers['wechatpay-serial']
    if (!timestamp || !nonce || !signature) {
      throw new BadRequestException('回调缺少验签头')
    }
    if (this.pubKeyId && serial !== this.pubKeyId) {
      // 平台公钥已轮换：需下载更新 wechatpay_pub.pem
      this.logger.warn(`回调公钥序列 ${serial} 与配置 ${this.pubKeyId} 不一致，可能平台公钥已轮换`)
    }
    const message = `${timestamp}\n${nonce}\n${rawBody}\n`
    const ok = verify('RSA-SHA256', Buffer.from(message, 'utf8'), this.publicKeyPem, Buffer.from(signature, 'base64'))
    if (!ok) {
      throw new BadRequestException('回调验签失败')
    }
    return this.decryptResource(rawBody)
  }

  /** 解密 resource（AES-256-GCM，密钥 = APIv3 密钥）
   *  微信密文结构：ciphertext 为 base64 字符串，解码后 = [AES密文(不含tag) | 16字节auth tag]
   *  必须【先整体 base64 解码为 Buffer】，再从 Buffer 尾部取 tag（不能对 base64 字符串切片）
   */
  private decryptResource(rawBody: string): NotifyResult {
    const body = JSON.parse(rawBody)
    const resource = body.resource
    if (!resource) throw new BadRequestException('回调缺少 resource')
    const { ciphertext, nonce, associated_data } = resource
    const key = Buffer.from(this.apiv3Key, 'utf8')
    const full = Buffer.from(ciphertext as string, 'base64')
    if (full.length < 16) throw new BadRequestException('回调密文不完整')
    const authTag = full.subarray(full.length - 16)
    const data = full.subarray(0, full.length - 16)
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(nonce, 'utf8'))
    decipher.setAuthTag(authTag)
    if (associated_data) decipher.setAAD(Buffer.from(associated_data, 'utf8'))
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
    return JSON.parse(decrypted) as NotifyResult
  }
}

export interface MiniPayParams {
  timeStamp: string
  nonceStr: string
  package: string
  signType: 'RSA'
  paySign: string
}

export interface NotifyResult {
  mchid: string
  appid: string
  out_trade_no: string
  transaction_id: string
  trade_type: string
  trade_state: string
  trade_state_desc?: string
  bank_type?: string
  attach?: string
  success_time?: string
  payer?: { openid: string }
  amount?: { total: number; payer_total?: number; currency?: string; payer_currency?: string }
}
