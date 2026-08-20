import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Setting } from './setting.entity'

export interface AppSettings {
  customerServiceWechat: string
  notice: string
  payTimeoutMinutes: number
  orderOpen: boolean
  payWechat: boolean
  payBalance: boolean
  /** 打手押金金额（分，默认 20000 = ¥200，可在控制台改） */
  depositAmount: number
  /** 平台抽成比例（%，0=不抽成，打手收入=订单全额） */
  platformRate: number
  /** 结算延迟天数（T+N，收入订单完成后 N 天解冻可提现） */
  settlementDays: number
}

const DEFAULTS: AppSettings = {
  customerServiceWechat: 'XJES-KF',
  notice: '星竞电竞 · 大神陪玩，稳定上分！',
  payTimeoutMinutes: 15,
  orderOpen: true,
  payWechat: true,
  payBalance: false,
  depositAmount: 20000,
  platformRate: 0,
  settlementDays: 3
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>
  ) {}

  /** 读取全部设置（合并默认值） */
  async getMap(): Promise<AppSettings> {
    const rows = await this.settingRepo.find()
    const map: Record<string, any> = {}
    rows.forEach((r) => {
      try {
        map[r.key] = JSON.parse(r.value)
      } catch {
        map[r.key] = r.value
      }
    })
    return { ...DEFAULTS, ...map }
  }

  /** 小程序端公开配置（公告/客服/下单开关等） */
  async getPublic() {
    const s = await this.getMap()
    return {
      customerServiceWechat: s.customerServiceWechat,
      notice: s.notice,
      orderOpen: s.orderOpen
    }
  }

  /** 更新设置（仅存在的 key 生效） */
  async update(patch: Partial<AppSettings>): Promise<AppSettings> {
    const keys = Object.keys(DEFAULTS) as (keyof AppSettings)[]
    for (const key of keys) {
      if (patch[key] !== undefined) {
        let row = await this.settingRepo.findOne({ where: { key } })
        const value = JSON.stringify(patch[key])
        if (row) {
          row.value = value
          await this.settingRepo.save(row)
        } else {
          row = this.settingRepo.create({ key, value })
          await this.settingRepo.save(row)
        }
      }
    }
    return this.getMap()
  }

  /** 重置：删除全部设置记录（回默认值） */
  async reset(): Promise<AppSettings> {
    await this.settingRepo.clear()
    return this.getMap()
  }
}
