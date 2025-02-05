import { Injectable } from '@nestjs/common';
import { IExchangeRateDaily } from '../interface/exchange-rate-daily.interface';
import { Prisma } from '@prisma/client';
import { ExchangeRatesDailyEntity } from '../entitites/exchange-rate-daily.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

@Injectable()
export class ExchangeRateDailyRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  async saveDailyRates(input: IExchangeRateDaily.ICreate): Promise<void> {
    await this.txHost.tx.exchangeRatesDaily.create({
      data: input,
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
