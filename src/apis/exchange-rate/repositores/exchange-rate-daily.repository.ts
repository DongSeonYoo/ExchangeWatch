import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IExchangeRateDaily } from '../interface/exchange-rate-daily.interface';
import { Prisma } from '@prisma/client';
import { ExchangeRatesDailyEntity } from '../entitites/exchange-rate-daily.entity';

@Injectable()
export class ExchangeRateDailyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveDailyRates(
    input: IExchangeRateDaily.ICreate[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await (tx ?? this.prisma).exchangeRatesDaily.createMany({
      data: input,
    });

    return;
  }

  async findDailyRates(
    input: IExchangeRateDaily.IFindDailyRatesInput,
    tx?: Prisma.TransactionClient,
  ): Promise<ExchangeRatesDailyEntity[]> {
    const result = await (tx ?? this.prisma).exchangeRatesDaily.findMany({
      where: {
        baseCurrency: input.baseCurrency,
        currencyCode: input.currencyCode,
        ohlcDate: {
          gte: input.startedAt,
          lte: input.endedAt,
        },
      },
      orderBy: {
        ohlcDate: 'asc',
      },
    });

    return result.map(ExchangeRatesDailyEntity.from);
  }
}
