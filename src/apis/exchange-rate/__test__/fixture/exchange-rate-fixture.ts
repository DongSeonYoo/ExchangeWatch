import { IFixerAPIResponse } from '../../../src/externals/exchange-rates/fixer/interfaces/fixer-response.interface';

export class ExchangeRateFixture {
  static createLatestRates(
    baseCurrency: string,
    rates: IFixerAPIResponse.IRateResponse['rates'],
  ): IFixerAPIResponse.IRateResponse {
    return {
      base: baseCurrency,
      timestamp: new Date(),
      date: new Date(),
      success: true,
      rates: rates,
    };
  }

  static createFluctuationRates(
    base: string,
    rates: IFixerAPIResponse.IFluctuationResponse['rates'],
  ): IFixerAPIResponse.IFluctuationResponse {
    return {
      base,
      fluctuation: true,
      start_date: new Date(),
      end_date: new Date(),
      success: true,
      rates: rates,
    };
  }
}
