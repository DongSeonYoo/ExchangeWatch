import * as prisma from '@prisma/client';
import {
  NotificationDataMap,
  NotificationType,
} from '../types/notification.type';

export class NotificationEntity<T extends NotificationType = NotificationType> {
  /**
   * 알림 인덱스
   *
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  idx: string;

  /**
   * 사용자 인덱스
   *
   * @example 1
   */
  userIdx: number;

  /**
   * 알림 타입
   */
  notificationType: NotificationType;

  /**
   * 알림 데이터 (JSONB)
   *
   * @example { "baseCurrency": "USD", "targetPrice": 1000 }
   */
  notificationData: NotificationDataMap[T];

  /**
   * 알림 활성화 여부
   *
   * @example true
   */
  isActive: boolean;

  /**
   * 생성일
   *
   * @example "2024-02-26T12:00:00Z"
   */
  createdAt: Date;

  /**
   * 수정일
   *
   * @example "2024-02-26T12:10:00Z"
   */
  updatedAt: Date;

  constructor(args: NotificationEntity<T>) {
    Object.assign(this, args);
  }

  static from<T extends NotificationType = NotificationType>(
    args: prisma.Notifications,
  ): NotificationEntity<T> {
    return new NotificationEntity<T>({
      idx: args.idx,
      userIdx: args.userIdx,
      notificationType: args.notificationType as T,
      notificationData: args.notificationData as NotificationDataMap[T],
      isActive: args.isActive,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
  }
}
