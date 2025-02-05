import { Injectable } from '@nestjs/common';
import { IExchangeRate } from '../interface/exchange-rate.interface';
import { ExchangeRateDailyStasEntity } from '../entitites/exchange-rate-daily-statistics.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

@Injectable()
export class ExchangeRateRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  async saveLatestRates(input: IExchangeRate.ICreate[]): Promise<void> {
    await this.txHost.tx.exchangeRates.createMany({
      data: input,
    });

    return;
  }

  async findDailyStats(
    startDate: Date,
    endDate: Date,
  ): Promise<ExchangeRateDailyStasEntity[]> {
    const result = await this.txHost.tx.exchangeRates.groupBy({
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
}
