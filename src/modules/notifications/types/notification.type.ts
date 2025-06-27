export const NOTIFICATION_TYPES = {
  TARGET_PRICE: 'TARGET_PRICE',
  RAPID_FLUCTUATION: 'RAPID_FLUCTUATION',
  DAILY_REPORT: 'DAILY_REPORT',
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

export type NotificationDataMap = {
  [NOTIFICATION_TYPES.TARGET_PRICE]: {
    baseCurrency: string;
    currencyCode: string;
    targetPrice: number;
  };
  [NOTIFICATION_TYPES.RAPID_FLUCTUATION]: {
    currencyPair: string;
    fluctuationPercentage: number;
    timePeriodMinutes: number;
  };
  [NOTIFICATION_TYPES.DAILY_REPORT]: {
    currencies: string[];
    deliveryTime: string;
  };
};

export type NotificationData<T extends NotificationType> = {
  notificationType: T;
  data: NotificationDataMap[T];
};
