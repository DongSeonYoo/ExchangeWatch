export class LatestRateEvent {
  static readonly eventName = 'exchangeRate.received';

  constructor(
    readonly timestamp: number,
    readonly baseCurrency: string,
    readonly currencyCode: string,
    readonly rate: number,
  ) {}
}
