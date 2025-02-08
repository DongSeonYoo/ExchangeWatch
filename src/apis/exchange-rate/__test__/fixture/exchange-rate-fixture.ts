import { IExchangeRateExternalAPI } from '../../../../externals/exchange-rates/interfaces/exchange-rate-api.interface';

export class ExchangeRateFixture {
  static createLatestRates(
    baseCurrency: string,
    rates: IExchangeRateExternalAPI.ILatestRatesResponse['rates'],
  ): IExchangeRateExternalAPI.ILatestRatesResponse {
    return {
      baseCurrency: baseCurrency,
      date: new Date(),
      rates: rates,
    };
  }

  static createFluctuationRates(
    base: string,
    rates: IExchangeRateExternalAPI.IFluctuationResponse['rates'],
  ): IExchangeRateExternalAPI.IFluctuationResponse {
    return {
      baseCurrency: base,
      startDate: new Date(),
      endDate: new Date(),
      rates: rates,
    };
  }
}
