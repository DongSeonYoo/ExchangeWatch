import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { IRedisSchema } from '../../../infrastructure/redis/interfaces/redis-schema.interface';

@Injectable()
export class ExchangeRateRedisService {
  private readonly logger = new Logger(ExchangeRateRedisService.name);
  private readonly latestRateKey = 'exchange-rate:latest-rate';
  private readonly healthCheckey = 'exchange-rate:health-check';
  private readonly rateUpdateChannelKey = 'exchange-rate:rate-update';

  constructor(private readonly redisService: RedisService) {}

  async getLatestRate(
    baseCurrency: string,
    currencyCode: string,
    fields: Partial<Record<keyof IRedisSchema.ILatestRateHash, boolean>> = {
      change: true,
      changePct: true,
      rate: true,
      timestamp: true,
    },
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

  async updateHealthCheck(baseCurrency: string): Promise<void> {
    const key = `${this.healthCheckey}:${baseCurrency}`;

    await this.redisService.set(key, new Date().toISOString());

    this.logger.debug(`update latest-rate healthcheck!!: ${baseCurrency}`);
  }

  async getLatestRateHealthCheck(baseCurrency: string): Promise<Date | null> {
    const key = `${this.healthCheckey}:${baseCurrency}`;
    const result = await this.redisService.get(key);

    return result ? new Date(result) : null;
  }
}
