export class NotificationHistoryEntity {
  /**
   * 알림 히스토리 인덱스
   *
   * @example 123e4567-e89b-12d3-a456-426614174000
   */
  idx: number;

  /**
   * 유저 인덱스
   *
   * @example 1
   */
  userIdx: number;

  /**
   * 알림 인덱스
   *
   * @example 123e4567-e89b-42d3-a456-123412312412
   */
  notificationIdx: number;

  /**
   * 알림이 발생했을 때의 환율
   *
   * @example 1000
   */
  currenctPrice: number;

  /**
   * 알림이 발생했을 때의 시간
   *
   * @example 2021-01-01T00:00:00
   */
  triggedAt: Date;

  /**
   * 알림이 사용자에게 전송되었는지 여부
   *
   * @example true
   */
  sentToUser: boolean;
}
