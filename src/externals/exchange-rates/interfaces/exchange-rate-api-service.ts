import { IExchangeRateExternalAPI } from './exchange-rate-api.interface';

export interface IExchangeRateAPIService {
  // Latest Exchange Rate Data
  getLatestRates(
    baseCurrency?: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.ILatestRatesResponse>;

  // Historical data by date
  getHistoricalRates(
    date: Date,
    baseCurrency?: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.IHistoricalResponse>;

  // OHLC data by preiod
  getOHLCData(
    startDate: Date,
    endDate: Date,
    baseCurrency?: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.IFluctuationResponse>;

  // Time series data by period
  getTimeSeriesData(
    startDate: Date,
    endDate: Date,
    baseCurrency?: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.ITimeSeriesResponse>;
}
