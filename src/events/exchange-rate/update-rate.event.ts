import { Injectable } from '@nestjs/common';
import { IRedisSchema } from '../../redis/interfaces/redis-schema.interface';

@Injectable()
export class UpdateRateEvent {
  static readonly eventName = 'EXCHANGE_RATE.RATE_UPDATE';

  constructor(
    readonly baseCurrency: string,
    readonly data: IRedisSchema.IUpdateRate,
  ) {}
}
