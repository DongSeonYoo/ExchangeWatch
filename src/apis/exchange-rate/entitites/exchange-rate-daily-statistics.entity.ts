import { IExchangeRateDailyStats } from '../interface/exchange-rate-daily-stats.interface';

export class ExchangeRateDailyStasEntity {
  baseCurrency: string;
  currencyCode: string;
  maxRate: number;
  minRate: number;
  avgRate: number;
  count: number;

  constructor(args: ExchangeRateDailyStasEntity) {
    Object.assign(this, args);
  }

  static from(
    args: IExchangeRateDailyStats.IDailyStats,
  ): ExchangeRateDailyStasEntity {
    return new ExchangeRateDailyStasEntity({
      baseCurrency: args.baseCurrency,
      currencyCode: args.currencyCode,
      avgRate: args.avgRate,
      count: args.count,
      maxRate: args.maxRate,
      minRate: args.minRate,
    });
  }
}
