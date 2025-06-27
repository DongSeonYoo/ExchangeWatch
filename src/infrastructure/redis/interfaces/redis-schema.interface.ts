export namespace IRedisSchema {
  export interface ILatestRateHash {
    rate: number;
    change: number;
    changePct: number;
    timestamp: number;
    openRate: number;
  }

  export interface IUpdateRate extends ILatestRateHash {
    baseCurrency: string;
    currencyCode: string;
  }
}
