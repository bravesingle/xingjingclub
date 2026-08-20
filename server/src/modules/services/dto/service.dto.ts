import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { PageQueryDto } from '../../../common/dto/page-query.dto'

/** 小程序端服务列表查询 */
export class QueryServicesDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  category?: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  mode?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  keyword?: string

  @IsOptional()
  @IsIn(['sales', 'price_asc', 'price_desc'])
  sort?: string
}

/** 新增服务 */
export class CreateServiceDto {
  @IsString()
  @MaxLength(64)
  title: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  subtitle?: string

  @IsIn(['rank', 'loot', 'task', 'warfare'])
  category: string

  @IsIn(['hazard', 'warfare'])
  mode: string

  @IsIn(['hour', 'match'])
  priceUnit: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  basePrice: number

  @IsOptional()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  @MaxLength(32)
  coverText?: string

  /** 封面图片路径（/uploads/xxx） */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  cover?: string
}

/** 编辑服务 */
export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  subtitle?: string

  @IsOptional()
  @IsIn(['rank', 'loot', 'task', 'warfare'])
  category?: string

  @IsOptional()
  @IsIn(['hazard', 'warfare'])
  mode?: string

  @IsOptional()
  @IsIn(['hour', 'match'])
  priceUnit?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  basePrice?: number

  @IsOptional()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  @MaxLength(32)
  coverText?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  cover?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
  rating?: number
}
