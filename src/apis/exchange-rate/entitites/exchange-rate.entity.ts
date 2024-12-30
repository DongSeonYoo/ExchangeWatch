import prisma from '@prisma/client';

export class ExchangeRateEntity {
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

  /**
   * convert prisma entity TO domain entity
   *
   * @param input prisma return type
   * @returns domain entity
   */
  static from(input: prisma.ExchangeRates): ExchangeRateEntity {
    const entity = new ExchangeRateEntity();
    entity.idx = input.idx;
    entity.baseCurrency = input.baseCurrency;
    entity.currencyCode = input.currencyCode;
    entity.rate = input.rate.toNumber();
    entity.createdAt = input.createdAt;

    return entity;
  }
}
