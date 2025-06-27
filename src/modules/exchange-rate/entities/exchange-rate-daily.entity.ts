import Prisma from '@prisma/client';

export class ExchangeRatesDailyEntity {
  /**
   * 고유 식별자
   *
   * @example 1
   */
  idx: number;

  /**
   * 기준 통화 코드
   * @example "EUR"
   */
  baseCurrency: string;

  /**
   * 타겟 통화 코드
   * @example "KRW"
   */
  currencyCode: string;

  /**
   * 환율
   *
   * @example 1301.30
   */
  rate: number;

  /**
   * 환율 날짜
   */
  rateDate: Date;

  /**
   * 생성일시
   * @example "2024-01-01T00:00:00.000Z"
   */
  createdAt: Date;

  constructor(args: ExchangeRatesDailyEntity) {
    Object.assign(this, args);
  }

  static from(args: Prisma.ExchangeRatesDaily): ExchangeRatesDailyEntity {
    return new ExchangeRatesDailyEntity({
      ...args,
      rate: args.rate.toNumber(),
      rateDate: args.rateDate,
    });
  }
}
