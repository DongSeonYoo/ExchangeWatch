export namespace IExchangeRateDaily {
  export interface ICreate {
    baseCurrency: string;
    currencyCode: string;
    openRate: number;
    highRate: number;
    lowRate: number;
    closeRate: number;
    avgRate: number;
    rateCount: number;
  }

  export interface ICreateMany extends Array<ICreate> {}
}
