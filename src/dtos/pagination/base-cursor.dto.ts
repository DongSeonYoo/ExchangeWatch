import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class BaseCursorDto {
  /**
   * 페이지당 항목 수
   */
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit: number = 10;

  /**
   * 다음 페이지 커서
   */
  @IsOptional()
  cursor?: string;
}
