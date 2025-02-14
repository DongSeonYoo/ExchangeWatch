export namespace ICurrencyLayerResponse {
  export interface IRealTimeRates {
    success: boolean;
    terms: string;
    privacy: string;
    timestamp: number;
    source: string;
    quotes: Record<string, number>;
  }

  export interface IHistoricalRates {
    success: boolean;
    terms: string;
    privacy: string;
    historical: boolean;
    date: Date;
    timestamp: number;
    source: string;
    quotes: Record<string, number>;
  }

  export interface ITimeFrameRates {
    success: boolean;
    terms: string;
    privacy: string;
    timeframe: boolean;
    start_date: Date;
    end_date: Date;
    source: string;
    quotes: Record<string, Record<string, number>>;
  }
}
