export namespace IFrankFurter {
  export interface ILatestRates {
    base: string;
    date: Date;
    rates: Record<string, number>;
  }

  export interface IHistorical {
    base: string;
    date: Date;
    rates: Record<string, number>;
  }

  export interface ITimeSeries {
    base: string;
    start_date: Date;
    end_date: Date;
    rates: Record<string, Record<string, number>>;
  }

  export interface ISymbol {
    [key: string]: string;
  }

  export type TFluctuation = {
    start_rate: number;
    end_rate: number;
    change: number;
    change_pct: number;
  };

  export interface IFluctuationResponse {
    base: string;
    start_date: Date;
    end_date: Date;
    rates: Record<string, TFluctuation>;
  }
}
