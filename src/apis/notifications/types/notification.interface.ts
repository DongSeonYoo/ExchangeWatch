import { NotificationDataMap, NotificationType } from './notification.type';

export namespace INotification {
  export interface ICreate<T extends NotificationType> {
    userIdx: number;
    notificationType: T;
    notificationData: NotificationDataMap[T];
  }

  export interface ISelect<T extends NotificationType> {
    notificationType: T;
    notificationData: NotificationDataMap[T];
  }
}
