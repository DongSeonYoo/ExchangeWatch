import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { IExchangeRate } from '../apis/exchange-rate/interface/exchange-rate.interface';
import { LatestRateCache } from './interface/currency-rate.interface';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly CACHE_TTL = {
    CURRENT_RATES: 15 * 60, // 15 min
  };

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Update real-time currency rate to the redis
   */
  async updateLatestRateCache(
    rates: IExchangeRate.ICreateMany,
    ttl = this.CACHE_TTL.CURRENT_RATES,
  ) {
    await Promise.all(
      rates.map((rate) =>
        this.redisClient.set(
          `rate:${rate.baseCurrency}:${rate.currencyCode}`,
          JSON.stringify(<LatestRateCache>{
            rate: rate.rate,
            updatedAt: new Date(),
          }),
          'EX',
          Number(ttl),
        ),
      ),
    );
  }

  onModuleInit() {
    this.redisClient.on('ready', () => {
      this.logger.log('Redis client is ready.');
    });

    this.redisClient.on('error', (error) => {
      this.logger.error(`Redis client error: ${error}`);
    });
  }
}
