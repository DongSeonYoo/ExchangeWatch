// {
//   notification: {
//     title: '환율 알림',
//     body: 'USD가 {목표가}에 도달했습니다',
//   },
//   data: {
//     type: 'TARGET_PRICE',
//     baseCurrency: 'KRW',
//     currencyCode: 'USD',
//   }
// }

import {
  NotificationDataMap,
  NotificationType,
} from '../../notifications/types/notification.type';

export namespace IFcmNotification {
  interface IBase {
    notification: {
      title: string;
      body: string;
    };
  }

  export interface ICreate<T extends NotificationType> extends IBase {
    notificationType: T;
    data: NotificationDataMap[T];
  }
}
