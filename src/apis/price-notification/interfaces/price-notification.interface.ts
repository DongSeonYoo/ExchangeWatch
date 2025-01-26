import { PriceNotificationEntity } from '../entitites/price-notification.entity';

export namespace IPriceAlertEntity {
  export interface ICreate
    extends Pick<
      PriceNotificationEntity,
      | 'userIdx'
      | 'baseCurrency'
      | 'currencyCode'
      | 'targetPrice'
      | 'condition'
      | 'isRepeatable'
    > {}
}
