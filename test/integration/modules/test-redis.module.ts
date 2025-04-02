import { Module } from '@nestjs/common';
import { TestFixtureUtil } from '../utils/integrate-test-fixture.util';

export const TEST_REDIS_TOKEN = 'TEST_REDIS_TOKEN';

@Module({
  providers: [
    {
      provide: TEST_REDIS_TOKEN,
      useValue: TestFixtureUtil.getInstance().redis,
    },
    {
      provide: 'REDIS_CLIENT',
      useExisting: TEST_REDIS_TOKEN,
    },
  ],
  exports: [TEST_REDIS_TOKEN, 'REDIS_CLIENT'],
})
export class TestRedisModule {}
