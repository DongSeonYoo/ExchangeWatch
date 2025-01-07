export namespace IExchangeRate {
  export interface ICreate {
    baseCurrency: string;
    currencyCode: string;
    rate: number;
  }

  export interface ICreateMany extends Array<ICreate> {}
}
