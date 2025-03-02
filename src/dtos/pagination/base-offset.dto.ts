import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class BaseOffsetDto {
  /**
   * 페이지 번호
   */
  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page: number = 1;

  /**
   * 페이지당 항목 수
   */
  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit: number = 10;

  getOffset(): number {
    return (this.page - 1) * this.limit;
  }
}

export class BaseOffsetResDto {
  /**
   * offset 메타데이터
   */
  meta: {
    /**
     * 데이터 총 합 개수
     */
    totalCount: number;

    /**
     * 페이지당 항목 수
     */
    limit: number;

    /**
     * offset
     */
    offset: number;
  };
}
