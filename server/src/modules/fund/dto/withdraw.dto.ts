import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import { Type } from 'class-transformer'

/** 提现申请 */
export class WithdrawDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount: number

  @IsOptional()
  @IsIn(['wechat', 'alipay', 'bank'])
  channel?: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  account?: string
}
