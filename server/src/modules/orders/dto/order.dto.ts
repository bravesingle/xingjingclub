import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { PageQueryDto } from '../../../common/dto/page-query.dto'

/** 创建订单 */
export class CreateOrderDto {
  @Type(() => Number)
  @IsInt()
  serviceId: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  specValue: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number

  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  contact?: string
}

/** 我的订单列表 */
export class QueryOrdersDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(24)
  status?: string
}

/** 申请退款 */
export class ApplyRefundDto {
  @IsString()
  @MaxLength(32)
  reason: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  detail?: string
}
