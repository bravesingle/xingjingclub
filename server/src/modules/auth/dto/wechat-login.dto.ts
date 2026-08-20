import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'

/** 微信登录入参：wx.login 的 code + 可选资料 + 手机号（身份绑定） */
export class WechatLoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  code: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  nickname?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  gameId?: string

  /** 手机号（必填，用于身份匹配，普通用户与打手都按手机号锚定） */
  @IsString()
  @Matches(/^1[0-9]{10}$/, { message: '手机号格式不正确' })
  phone: string
}
