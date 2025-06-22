import Redis from 'ioredis';
import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/config.type';
import { RateUpdateSubscriber } from './subscribers/rate-update.subscriber';
import { LockManagerService } from './lock-manager.service';

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
    RateUpdateSubscriber,
    LockManagerService,
  ],
  exports: [LockManagerService, RedisService],
})
export class RedisModule {}
