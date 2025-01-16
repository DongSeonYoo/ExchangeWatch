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
   * 시가
   *
   * @example 1298.50
   */
  openRate: number;

  /**
   * 고가
   *
   * @example 1305.20
   */
  highRate: number;

  /**
   * 저가
   *
   * @example 1297.80
   */
  lowRate: number;

  /**
   * 종가
   *
   * @example 1301.30
   */
  closeRate: number;

  /**
   * 하루 평균 환율
   *
   * @example 1300.25
   */
  avgRate: number;

  /**
   * 하루동안 수집된 데이터 양
   *
   * 데이터 품질 모니터링 용도
   * avgRate의 신뢰성 보장하기 위함
   *
   * @example 540
   */
  rateCount: number;

  /**
   * 시장 거래일 (OHLC데이터 기준일)
   */
  ohlcData: Date;

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
      highRate: args.highRate.toNumber(),
      openRate: args.openRate.toNumber(),
      lowRate: args.lowRate.toNumber(),
      closeRate: args.closeRate.toNumber(),
      avgRate: args.avgRate.toNumber(),
      ohlcData: args.ohlcDate,
    });
  }
}
