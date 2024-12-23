export class AlertHistoryEntity {
  /**
   * 알림 이력 인덱스
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  idx: string;

  /**
   * 유저 인덱스
   * @example 1
   */
  userIdx: number;

  /**
   * 알림 인덱스
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  alertIdx: string;

  /**
   * 발생 당시 환율
   * @example 1305.50
   */
  rate: number;

  /**
   * 알림 발생 시각
   * @example "2024-01-01T00:00:00.000Z"
   */
  triggeredAt: Date;
}

export namespace IAlertHistoryEntity {
  export interface ICreate
    extends Pick<AlertHistoryEntity, 'userIdx' | 'alertIdx' | 'rate'> {}
}
