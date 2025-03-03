import { NotificationDataMap, NotificationType } from './notification.type';

export namespace INotification {
  export interface ICreate<T extends NotificationType> {
    userIdx: number;
    notificationType: T;
    notificationData: NotificationDataMap[T];
  }

  export interface ISelect<T extends NotificationType> {
    notificationType?: T;
    userIdx: number;
  }

  export interface ISelectWithOffset<T extends NotificationType> {
    userIdx: number;
    limit: number;
    offset: number;
    notificationType?: T;
  }
}
