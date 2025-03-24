import { IsNotEmpty } from 'class-validator';
import {
  NotificationDataMap,
  NotificationType,
} from '../types/notification.type';

export class BaseNotificationDto<
  T extends NotificationType = NotificationType,
> {
  /**
   * 알림 데이터
   */
  @IsNotEmpty()
  notificationData: NotificationDataMap[T];
}
