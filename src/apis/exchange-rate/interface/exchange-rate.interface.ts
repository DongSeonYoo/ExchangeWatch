import { ExchangeRatesEntity } from '../entitites/exchange-rate.entity';

export namespace IExchangeRate {
  export interface ICreate
    extends Pick<
      ExchangeRatesEntity,
      'baseCurrency' | 'currencyCode' | 'rate'
    > {}

  export interface IFindByDate
    extends Pick<ExchangeRatesEntity, 'baseCurrency' | 'currencyCode'> {
    startDate: Date;
    endDate: Date;
  }
}
