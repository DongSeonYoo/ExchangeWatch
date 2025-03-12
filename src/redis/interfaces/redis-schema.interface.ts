export namespace IRedisSchema {
  export interface ILatestRateHash {
    rate: number;
    change: number;
    changePct: number;
    timestamp: number;
  }
}
