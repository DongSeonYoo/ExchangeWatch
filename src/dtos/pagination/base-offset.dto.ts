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

  getSkip(): number {
    return (this.page - 1) * this.limit;
  }
}
