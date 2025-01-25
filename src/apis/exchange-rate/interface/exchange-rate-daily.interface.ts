import { ExchangeRatesDailyEntity } from '../entitites/exchange-rate-daily.entity';

export namespace IExchangeRateDaily {
  export interface ICreate
    extends Pick<
      ExchangeRatesDailyEntity,
      | 'baseCurrency'
      | 'currencyCode'
      | 'openRate'
      | 'highRate'
      | 'lowRate'
      | 'closeRate'
      | 'avgRate'
      | 'ohlcDate'
      | 'rateCount'
    > {}

  export interface IFindDailyRatesInput {
    baseCurrency: string;
    currencyCode: string;
    startedAt: Date;
    endedAt: Date;
  }
}
