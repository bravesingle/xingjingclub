import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

/** 微信一键登录入参：wx.login 的 code + getPhoneNumber 的手机号授权 code */
export class WechatPhoneLoginDto {
  /** wx.login 返回的 code（换 openid） */
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  code: string

  /** button open-type="getPhoneNumber" 回调的 e.detail.code（换手机号） */
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  phoneCode: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  nickname?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  gameId?: string
}
