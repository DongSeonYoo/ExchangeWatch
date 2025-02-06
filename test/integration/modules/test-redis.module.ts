import { Module } from '@nestjs/common';
import { testRedisConn } from '../setup';
import { RedisService } from '../../../src/redis/redis.service';

export const TEST_REDIS_TOKEN = 'TEST_REDIS_TOKEN';

@Module({
  providers: [
    {
      provide: TEST_REDIS_TOKEN,
      useValue: testRedisConn,
    },
    {
      provide: 'REDIS_CLIENT',
      useExisting: TEST_REDIS_TOKEN,
    },
  ],
  exports: [TEST_REDIS_TOKEN, 'REDIS_CLIENT'],
})
export class TestRedisModule {}
