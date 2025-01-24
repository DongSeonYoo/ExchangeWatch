import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IExchangeRateDaily } from '../interface/exchange-rate-daily.interface';
import { Prisma } from '@prisma/client';

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
}
