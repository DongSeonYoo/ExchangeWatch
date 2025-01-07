import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IExchangeRate } from './interface/exchange-rate.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExchangeRateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async intertMany(
    input: IExchangeRate.ICreateMany,
    tx?: Prisma.TransactionClient,
  ) {
    await (tx ?? this.prisma).exchangeRates.createMany({
      data: input,
    });
  }
}
