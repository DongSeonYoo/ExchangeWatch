// price-alert.entity.ts
export class PriceAlertEntity {
  /**
   * 알림 인덱스
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  idx: string;

  /**
   * 유저 인덱스
   * @example 1
   */
  userIdx: number;

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
   * 목표 가격
   * @example 1300.00
   */
  targetPrice: number;

  /**
   * 알림 조건
   * @example "ABOVE"
   */
  condition: string;

  /**
   * 알림 발생 여부
   * @example false
   */
  isTriggered: boolean;

  /**
   * 알림 반복 여부
   * @example false
   */
  isRepeatable: boolean;

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

  /**
   * 삭제일시
   * @example null
   */
  deletedAt: Date | null;
}

export namespace IPriceAlertEntity {
  export interface ICreate
    extends Pick<
      PriceAlertEntity,
      | 'userIdx'
      | 'baseCurrency'
      | 'currencyCode'
      | 'targetPrice'
      | 'condition'
      | 'isRepeatable'
    > {}
}
