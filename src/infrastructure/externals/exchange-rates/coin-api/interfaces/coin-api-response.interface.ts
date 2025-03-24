export namespace ICoinApiResponse {
  export interface ICurrentRatesResponse {
    asset_id_base: string;
    rates: Array<{
      time: Date;
      asset_id_quote: string;
      rate: number;
    }>;
  }

  export interface IFluctuationResponse {
    time_period_start: string;
    time_period_end: string;
    rate_open: number;
    rate_high: number;
    rate_low: number;
    rate_close: number;
  }
}
