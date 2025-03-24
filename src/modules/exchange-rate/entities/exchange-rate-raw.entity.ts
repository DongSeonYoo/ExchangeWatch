import Prisma from '@prisma/client';

export class ExchangeRateRawEntity {
  idx: number;
  baseCurrency: string;
  currencyCode: string;
  rate: number;
  createdAt: Date;

  private constructor(args: ExchangeRateRawEntity) {
    Object.assign(this, args);
  }

  static from(args: Prisma.ExchangeRatesRaw): ExchangeRateRawEntity {
    return new ExchangeRateRawEntity({
      ...args,
      rate: args.rate.toNumber(),
    });
  }
}
