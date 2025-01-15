import { IExchangeRate } from '../interface/exchange-rate.interface';

export class ExchangeRateDailyStatisticsEntity {
  baseCurrency: string;
  currencyCode: string;
  maxRate: number;
  minRate: number;
  avgRate: number;
  count: number;

  constructor(args: ExchangeRateDailyStatisticsEntity) {
    Object.assign(this, args);
  }

  static from(
    args: IExchangeRate.IDailyStatistics,
  ): ExchangeRateDailyStatisticsEntity {
    return new ExchangeRateDailyStatisticsEntity({
      baseCurrency: args.baseCurrency,
      currencyCode: args.currencyCode,
      avgRate: args.avgRate,
      count: args.count,
      maxRate: args.maxRate,
      minRate: args.minRate,
    });
  }
}
