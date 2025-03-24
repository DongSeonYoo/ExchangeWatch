import { Injectable } from '@nestjs/common';
import { IExchangeRateDaily } from '../interfaces/exchange-rate-daily.interface';
import { ExchangeRatesDailyEntity } from '../entities/exchange-rate-daily.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

@Injectable()
export class ExchangeRateDailyRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  async saveDailyRates(input: IExchangeRateDaily.ICreate[]): Promise<void> {
    await this.txHost.tx.exchangeRatesDaily.createMany({
      data: input,
      skipDuplicates: true,
    });

    return;
  }

  async findDailyRates(
    input: IExchangeRateDaily.IFindDailyRatesInput,
  ): Promise<ExchangeRatesDailyEntity[]> {
    const result = await this.txHost.tx.exchangeRatesDaily.findMany({
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
