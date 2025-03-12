import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis.service';
import { IRedisSchema } from '../interfaces/redis-schema.interface';

@Injectable()
export class ExchangeRateRedisService extends RedisService {
  private readonly latestRateKey = 'latest-rate';

  async getLatestRate(
    baseCurrency: string,
    currencyCode: string,
    fields: Partial<Record<keyof IRedisSchema.ILatestRateHash, boolean>>,
  ) {
    const key = `${this.latestRateKey}:${baseCurrency}/${currencyCode}`;

    return await this.redisClient.hmget(key, ...Object.keys(fields));
  }

  async setLatestRate(
    baseCurrency: string,
    currencyCode: string,
    fields: IRedisSchema.ILatestRateHash,
  ): Promise<void> {
    const key = `${this.latestRateKey}:${baseCurrency}/${currencyCode}`;

    await this.redisClient.hset(key, fields);
  }
}
