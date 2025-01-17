import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IExchangeRate } from './interface/exchange-rate.interface';
import { Prisma } from '@prisma/client';
import { ExchangeRateDailyStasEntity } from './entitites/exchange-rate-daily-statistics.entity';
import { IExchangeRateDaily } from './interface/exchange-rate-daily.interface';

@Injectable()
export class ExchangeRateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveLatestRates(
    input: IExchangeRate.ICreate[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await (tx ?? this.prisma).exchangeRates.createMany({
      data: input,
    });

    return;
  }

  async findDailyStats(
    startDate: Date,
    endDate: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<ExchangeRateDailyStasEntity[]> {
    const result = await (tx ?? this.prisma).exchangeRates.groupBy({
      by: ['baseCurrency', 'currencyCode'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _max: {
        rate: true,
      },
      _min: {
        rate: true,
      },
      _avg: {
        rate: true,
      },
      _count: {
        rate: true,
      },
    });

    return result.map((e) => {
      return ExchangeRateDailyStasEntity.from({
        currencyCode: e.currencyCode,
        baseCurrency: e.baseCurrency,
        maxRate: e._max.rate!.toNumber(),
        minRate: e._min.rate!.toNumber(),
        avgRate: e._avg.rate!.toNumber(),
        count: e._count.rate,
      });
    });
  }

  async saveDailyRates(
    input: IExchangeRateDaily.ICreate[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await (tx ?? this.prisma).exchangeRatesDaily.createMany({
      data: input,
    });

    return;
  }
}
