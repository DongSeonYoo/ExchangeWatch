import { ApiExtraModels } from '@nestjs/swagger';
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
  @Type(() => Number)
  cursor?: number;
}

export class CursorMetaResOption {
  /**
   * 다음 페이지 존재 여부
   * - false: 더 이상 데이터가 없음 (빈 목록 or 마지막 페이지)
   * - true: 다음 페이지 있음
   */
  hasNextPage: boolean;

  /**
   * 다음 페이지 커서
   * hasNextPage가 true일 때만 존재
   */
  nextCursor?: number;
}

@ApiExtraModels(CursorMetaResOption)
export class BaseCursorResDto {
  meta: CursorMetaResOption;
}
