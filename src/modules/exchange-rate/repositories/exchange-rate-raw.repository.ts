import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import { IExchangeRateRaw } from '../interfaces/exchange-rate-raw.interface';

@Injectable()
export class ExchangeRateRawRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  async createExchangeRate(input: IExchangeRateRaw.ICreateRate): Promise<void> {
    await this.txHost.tx.exchangeRatesRaw.create({
      data: {
        baseCurrency: input.baseCurrency,
        currencyCode: input.currencyCode,
        rate: input.rate,
      },
    });
  }
}
