import { ExchangeRatesDailyEntity } from '../entities/exchange-rate-daily.entity';

export namespace IExchangeRateDaily {
  export interface ICreate
    extends Pick<
      ExchangeRatesDailyEntity,
      | 'baseCurrency'
      | 'currencyCode'
      | 'rate'
      | 'rateDate'
    > {}

  export interface IFindDailyRatesInput {
    baseCurrency: string;
    currencyCode: string;
    startedAt: Date;
    endedAt: Date;
  }
}
