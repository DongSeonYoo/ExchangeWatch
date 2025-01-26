import { PriceNotificationEntity } from '../entitites/price-alert.entity';

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
