import { IExchangeRateExternalAPI } from './exchange-rate-api.interface';

export interface IExchangeRateRestAPIService {
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

  // fluctuation data by preiod
  getFluctuationData(
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

export type ILatestExchangeRateApi = Pick<
  IExchangeRateRestAPIService,
  'getLatestRates'
>;

export type IHistoricalExchangeRateApi = Pick<
  IExchangeRateRestAPIService,
  'getHistoricalRates'
>;

export type IFluctuationExchangeRateApi = Pick<
  IExchangeRateRestAPIService,
  'getFluctuationData'
>;

export type ITimeSeriesRateApi = Pick<
  IExchangeRateRestAPIService,
  'getTimeSeriesData'
>;
