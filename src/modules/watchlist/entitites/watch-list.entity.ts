import Prisma from '@prisma/client';

export class WatchlistEntity {
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

  constructor(args: WatchlistEntity) {
    Object.assign(this, args);
  }

  static from(args: Prisma.Watchlist): WatchlistEntity {
    return new WatchlistEntity({
      idx: args.idx,
      userIdx: args.userIdx,
      currencyCode: args.currencyCode,
      baseCurrency: args.baseCurrency,
      displayOrder: args.displayOrder,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
  }
}
