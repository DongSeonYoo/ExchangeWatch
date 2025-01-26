import { IFixerAPIResponse } from '../../../src/apis/fixer/interfaces/fixer-api.response';

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
