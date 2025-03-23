import Redis from 'ioredis';
import { Logger, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../configs/config.type';
import { ExchangeRateRedisService } from './services/exchange-rate-redis.service';
import { RateUpdateSubscriber } from './subscribers/rate-update.subscriber';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService<AppConfig, true>) => {
        return new Redis({
          host: configService.get('redis.host', { infer: true }),
          port: configService.get('redis.port', { infer: true }),
        });
      },
      inject: [ConfigService],
    },
    RedisService,
    ExchangeRateRedisService,
    RateUpdateSubscriber,
    Logger,
  ],
  exports: ['REDIS_CLIENT', ExchangeRateRedisService],
})
export class RedisModule {}
