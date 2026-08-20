import { IsInt, IsString, Max, Min, MinLength } from 'class-validator'
import { Type } from 'class-transformer'

/** 充值 */
export class RechargeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount: number
}

/** 兑换激活码 */
export class RedeemDto {
  @IsString()
  @MinLength(4)
  code: string
}

/** 后台生成激活码 */
export class GenerateCodesDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  count: number
}
