import { IsArray, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator'

/** 打手入驻申请（用户提交，后台审核通过后成为打手） */
export class ApplyBoosterDto {
  @IsString()
  @MaxLength(32)
  name: string

  @IsString()
  @Matches(/^1[0-9]{10}$/, { message: '手机号格式不正确' })
  phone: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[]

  @IsOptional()
  @IsIn(['hazard', 'warfare'])
  mode?: string

  @IsOptional()
  @IsString()
  @MaxLength(16)
  rank?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string

  /** 收款方式：wechat 微信 / bank 银行卡 */
  @IsOptional()
  @IsIn(['wechat', 'bank'])
  withdrawChannel?: string

  /** 收款账号（微信号/银行卡号） */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  withdrawAccount?: string
}
