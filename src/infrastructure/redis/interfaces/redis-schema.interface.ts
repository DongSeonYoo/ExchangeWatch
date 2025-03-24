export namespace IRedisSchema {
  export interface ILatestRateHash {
    rate: number;
    change: number;
    changePct: number;
    timestamp: number;
  }

  export interface IUpdateRate extends ILatestRateHash {
    baseCurrency: string;
    currencyCode: string;
  }
}
