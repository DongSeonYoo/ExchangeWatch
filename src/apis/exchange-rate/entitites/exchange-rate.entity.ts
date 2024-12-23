export class ExchangeRateEntity {
  /**
   * 환율 인덱스
   * @example 1
   */
  idx: number;

  /**
   * 기준 통화 코드
   * @example "KRW"
   */
  baseCurrency: string;

  /**
   * 통화 코드
   * @example "USD"
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
}
