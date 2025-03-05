export namespace IExchangeRateExternalAPI {
  export interface ILatestRatesResponse {
    baseCurrency: string;
    date: Date;
    rates: Record<string, number>;
  }

  export interface IHistoricalResponse {
    baseCurrency: string;
    date: Date;
    rates: Record<string, number>;
  }

  export interface ITimeSeriesResponse {
    baseCurrency: string;
    startDate: Date;
    endDate: Date;
    rates: Record<string, Record<string, number>>;
  }

  export interface ISymbolResponse {
    [key: string]: string;
  }

  export interface IFluctuationResponse {
    baseCurrency: string;
    startDate: Date;
    endDate: Date;
    rates: Record<string, TFluctuation>;
  }

  export type TFluctuation = {
    startRate: number;
    endRate: number;
    highRate: number;
    lowRate: number;
    change: number;
    changePct: number;
  };
}
