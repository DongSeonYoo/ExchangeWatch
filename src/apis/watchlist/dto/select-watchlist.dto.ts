import { IBaseCursorRes } from '../../../dtos/pagination/base-cursor.dto';
import { WatchlistEntity } from '../entitites/watch-list.entity';
import { IBaseCursorReq } from '../../../dtos/pagination/base-cursor.dto';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SelectWatchListReqDto implements IBaseCursorReq<number> {
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
   * 다음 페이지 커서 (watchlist 인덱스)
   *
   * @example 1
   */
  @Type(() => Number)
  cursor: number;
}

export class SelectWatchListResDto implements IBaseCursorRes<number> {
  readonly items: WatchlistEntity[];

  meta: {
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
  };

  constructor(args: SelectWatchListResDto) {
    Object.assign(this, args);
  }

  static of(
    items: WatchlistEntity[],
    nextCursor?: number,
  ): SelectWatchListResDto {
    return new SelectWatchListResDto({
      items,
      meta: {
        nextCursor,
        hasNextPage: nextCursor ? true : false,
      },
    });
  }
}
