import { IFrankFurter } from './frankfurter.interface';

export interface IFrankfurterService {
  // Latest rates
  getLatestRates(
    base?: string,
    symbols?: string[],
  ): Promise<IFrankFurter.ILatestRates>;

  // Get fluctuation rates
  getFluctuationRates(
    start_date: Date,
    end_date: Date,
    base?: string,
    symbols?: string[],
  ): Promise<IFrankFurter.IFluctuationResponse>;

  // Historical rates for specific date
  getHistoricalRates(
    date: Date,
    base?: string,
    symbols?: string[],
  ): Promise<IFrankFurter.IHistorical>;

  // Time series data
  getTimeSeriesRates(
    startDate: Date,
    endDate: Date,
    base?: string,
    symbols?: string[],
  ): Promise<IFrankFurter.ITimeSeries>;
}
