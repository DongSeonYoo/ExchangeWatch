import { ExchangeRateDailyStasEntity } from '../entitites/exchange-rate-daily-statistics.entity';

export namespace IExchangeRateDailyStats {
  export interface IDailyStats
    extends Pick<
      ExchangeRateDailyStasEntity,
      | 'baseCurrency'
      | 'currencyCode'
      | 'maxRate'
      | 'minRate'
      | 'avgRate'
      | 'count'
    > {}
}
