import { IsInt, IsOptional, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'

/** 通用分页查询参数 */
export class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize: number = 20
}
