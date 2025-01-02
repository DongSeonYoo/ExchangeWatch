import { IFixerAPIResponse } from './fixer-api.response';

export interface ICurrencyService {
  // Get latest rates
  getLatestRates(
    base?: string,
    symbols?: string[],
  ): Promise<IFixerAPIResponse.IRateResponse>;

  // Get fluctuation rates
  getFluctuationRates(
    start_date: Date,
    end_date: Date,
    base?: string,
    symbols?: string[],
  ): Promise<IFixerAPIResponse.IFluctuationResponse>;

  // Get historical rates
  getHistoricalRates(
    date: string,
    base?: string,
    symbols?: string[],
  ): Promise<IFixerAPIResponse.IHistoricalResponse>;
}
