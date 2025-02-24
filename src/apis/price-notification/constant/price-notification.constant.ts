export const PRICE_NOTIFICATION_TYPES = {
  TARGET_PRICE: 'target_price',
  RAPID_FLUCTUATION: 'rapid_fluctuation',
  DAILY_REPORT: 'daily_report',
} as const;

export type PriceNotificationType = keyof typeof PRICE_NOTIFICATION_TYPES;
