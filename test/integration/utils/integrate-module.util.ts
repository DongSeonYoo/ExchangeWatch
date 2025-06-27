import { TestConfigModule } from '../modules/test-config.module';
import { TestClsModule } from '../modules/test-cls.module';
import { TestPrismaModule } from '../modules/test-prisma.module';
import { TestRedisModule } from '../modules/test-redis.module';
import { DynamicModule, Type } from '@nestjs/common';
import { TestLoggerModule } from '../modules/test-logger.module';

export class TestIntegrateModules {
  static create(): (Type<any> | DynamicModule)[] {
    return [
      TestConfigModule,
      TestClsModule,
      TestPrismaModule,
      TestRedisModule,
      TestLoggerModule,
    ];
  }
}
