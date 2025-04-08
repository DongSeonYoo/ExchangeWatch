import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { IRedisSchema } from '../../../infrastructure/redis/interfaces/redis-schema.interface';

@Injectable()
export class ExchangeRateRedisService {
  private readonly latestRateKey = 'latest-rate';
  private readonly rateUpdateChannelKey = 'rate-update';

  constructor(private readonly redisService: RedisService) {}

  async getLatestRate(
    baseCurrency: string,
    currencyCode: string,
    fields: Partial<Record<keyof IRedisSchema.ILatestRateHash, boolean>>,
  ) {
    const key = `${this.latestRateKey}:${baseCurrency}/${currencyCode}`;

    return await this.redisService.hmget(key, Object.keys(fields));
  }

  async setLatestRate(
    baseCurrency: string,
    currencyCode: string,
    fields: IRedisSchema.ILatestRateHash,
  ): Promise<void> {
    const key = `${this.latestRateKey}:${baseCurrency}/${currencyCode}`;

    await this.redisService.hset(
      key,
      // @TODO type assertions to ILatestRateHash
      fields as any,
    );
  }

  async updateLatestRate(
    baseCurrency: string,
    currencyCode: string,
    fields: Partial<IRedisSchema.ILatestRateHash>,
  ): Promise<void> {
    const key = `${this.latestRateKey}:${baseCurrency}/${currencyCode}`;

    await this.redisService.hset(key, fields);
  }

  async publishRateUpdate(
    baseCurrency: string,
    currencyCode: string,
    fields: IRedisSchema.IUpdateRate,
  ): Promise<number> {
    const key = `${this.rateUpdateChannelKey}:${baseCurrency}/${currencyCode}`;

    return await this.redisService.publish(key, fields);
  }
}
