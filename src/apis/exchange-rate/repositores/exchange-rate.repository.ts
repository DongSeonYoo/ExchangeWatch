import { Injectable } from '@nestjs/common';
import { IExchangeRate } from '../interface/exchange-rate.interface';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ExchangeRatesEntity } from '../entitites/exchange-rate.entity';

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

  async findRatesByDate(
    input: IExchangeRate.IFindByDate,
  ): Promise<ExchangeRatesEntity[]> {
    const result = await this.txHost.tx.exchangeRates.findMany({
      where: {
        baseCurrency: input.baseCurrency,
        currencyCode: input.currencyCode,
        createdAt: {
          gte: input.startDate,
          lt: input.endDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return result.map(ExchangeRatesEntity.from);
  }
}
