import { Module } from '@nestjs/common';
import { redisConnection } from '../setup';

export const TEST_REDIS_TOKEN = 'TEST_REDIS_TOKEN';

@Module({
  providers: [
    {
      provide: TEST_REDIS_TOKEN,
      useValue: redisConnection,
    },
    {
      provide: 'REDIS_CLIENT',
      useExisting: TEST_REDIS_TOKEN,
    },
  ],
  exports: [TEST_REDIS_TOKEN, 'REDIS_CLIENT'],
})
export class TestRedisModule {}
