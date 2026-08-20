import { IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'
import { PageQueryDto } from '../../../common/dto/page-query.dto'

/** 管理端通用列表查询 */
export class AdminQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  keyword?: string

  @IsOptional()
  @IsString()
  @MaxLength(24)
  status?: string

  /** 0 下架 / 1 上架 / 空 全部 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsInt()
  onSale?: number
}

/** 批量删除 */
export class BatchDeleteDto {
  @IsArray()
  @IsInt({ each: true })
  ids: number[]
}

/** 订单状态流转动作 */
export class OrderActionDto {
  @IsString()
  action: string
}
