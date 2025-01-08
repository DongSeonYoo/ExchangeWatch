import prisma from '@prisma/client';

export class ExchangeRatesEntity {
  /**
   * 환율 인덱스
   * @example 1
   */
  idx: number;

  /**
   * 기준 통화 코드
   * @example "EUR"
   */
  baseCurrency: string;

  /**
   * 통화 코드
   * @example "KRW"
   */
  currencyCode: string;

  /**
   * 환율
   * @example 1304.50
   */
  rate: number;

  /**
   * 생성일시
   * @example "2024-01-01T00:00:00.000Z"
   */
  createdAt: Date;

  constructor(args: ExchangeRatesEntity) {
    Object.assign(this, args);
  }

  /**
   * convert prisma entity TO domain entity
   *
   * @param input prisma return type
   * @returns domain entity
   */
  static from(args: prisma.ExchangeRates): ExchangeRatesEntity {
    return new ExchangeRatesEntity({
      ...args,
      rate: args.rate.toNumber(),
    });
  }
}
