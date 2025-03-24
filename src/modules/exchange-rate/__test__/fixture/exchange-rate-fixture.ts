import { IExchangeRateExternalAPI } from '../../../../infrastructure/externals/exchange-rates/interfaces/exchange-rate-api.interface';

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
    baseCurrency: string,
    startDate: Date,
    endDate: Date,
    rates: IExchangeRateExternalAPI.IFluctuationResponse['rates'],
  ): IExchangeRateExternalAPI.IFluctuationResponse {
    return {
      baseCurrency,
      startDate,
      endDate,
      rates,
    };
  }
}
