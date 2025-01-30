import { ApiExtraModels } from '@nestjs/swagger';
import {
  BaseCursorDto,
  BaseCursorResDto,
} from '../../../dtos/pagination/base-cursor.dto';

export class SelectWatchListReqDto extends BaseCursorDto {}

export class InterestCurrencyPairItem {
  /**
   * 관심 통화 인덱스
   * @example 1
   */
  idx: number;

  /**
   * 유저 인덱스
   * @example 1
   */
  userIdx: number;

  /**
   * 통화 코드
   * @example "USD"
   */
  currencyCode: string;

  /**
   * 기준 통화 코드
   * @example "KRW"
   */
  baseCurrency: string;

  /**
   * 표시 순서
   * @example 1
   */
  displayOrder: number;

  /**
   * 생성일시
   * @example "2024-01-01T00:00:00.000Z"
   */
  createdAt: Date;

  /**
   * 수정일시
   * @example "2024-01-01T00:00:00.000Z"
   */
  updatedAt: Date;
}

@ApiExtraModels(InterestCurrencyPairItem)
export class SelectWatchListResDto extends BaseCursorResDto {
  items: InterestCurrencyPairItem[];

  constructor(args: SelectWatchListResDto) {
    super();
    Object.assign(this, args);
  }

  static of(
    items: InterestCurrencyPairItem[],
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
