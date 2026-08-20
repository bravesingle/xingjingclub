import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator'
import { Type } from 'class-transformer'

/** 新增打手 */
export class CreateBoosterDto {
  @IsString()
  @MaxLength(32)
  name: string

  /** 手机号（必填，登录身份备案，用于身份匹配） */
  @IsString()
  @Matches(/^1[0-9]{10}$/, { message: '手机号格式不正确（11 位）' })
  phone: string

  /** 审核状态（后台添加时可选，默认待审核；选 approved 立即生效） */
  @IsOptional()
  @IsIn(['pending', 'approved'])
  audit?: string

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
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string

  @IsOptional()
  @IsIn(['wechat', 'bank'])
  withdrawChannel?: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  withdrawAccount?: string
}

/** 更新打手 */
export class UpdateBoosterDto {
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  audit?: string

  @IsOptional()
  @IsString()
  @Matches(/^1[0-9]{10}$/, { message: '手机号格式不正确' })
  phone?: string

  @IsOptional()
  @IsBoolean()
  online?: boolean

  @IsOptional()
  @IsBoolean()
  accepting?: boolean

  /** 是否已交押金（正式由押金缴纳接口设置，此处供后台手动标记） */
  @IsOptional()
  @IsBoolean()
  deposited?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(16)
  rank?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string

  @IsOptional()
  @IsIn(['wechat', 'bank'])
  withdrawChannel?: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  withdrawAccount?: string
}
