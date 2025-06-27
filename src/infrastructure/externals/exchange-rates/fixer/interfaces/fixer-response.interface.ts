export namespace IFixerAPIResponse {
  export interface IRateResponse {
    success: boolean;
    timestamp: Date;
    base: string;
    date: Date;
    rates: Record<string, number>;
  }

  export interface ISymbolResponse {
    success: boolean;
    symbols: Record<string, string>;
  }

  export interface IHistoricalResponse {
    success: boolean;
    timestamp: Date;
    historical: boolean;
    base: string;
    date: Date;
    rates: Record<string, number>;
  }

  export interface ITimeSireiesResponse
    extends Pick<IHistoricalResponse, 'success' | 'base'> {
    timeseries: boolean;
    start_date: Date;
    end_date: Date;
    rates: Record<string, Record<string, number>>;
  }

  export interface IFluctuationResponse {
    success: boolean;
    fluctuation: boolean;
    start_date: Date;
    end_date: Date;
    base: string;
    rates: Record<string, TFluctuation>;
  }

  export type TFluctuation = {
    start_rate: number;
    end_rate: number;
    change: number;
    change_pct: number;
  };

  export interface IErrorResponse {
    success: boolean;
    error: {
      code: number;
      type: string;
      info: string;
    };
  }
}
