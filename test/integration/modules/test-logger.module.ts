import { Global, Module } from '@nestjs/common';
import { TestPrismaModule } from './test-prisma.module';
import { CustomLoggerService } from '../../../src/common/logger/custom-logger.service';
import { LoggerRepository } from '../../../src/common/logger/logger.repository';

@Global()
@Module({
  imports: [TestPrismaModule],
  providers: [
    CustomLoggerService,
    LoggerRepository,
    {
      provide: 'winston',
      useFactory: () => {
        return {
          log: jest.fn(),
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          verbose: jest.fn(),
        };
      },
    },
  ],
  exports: [CustomLoggerService],
})
export class TestLoggerModule {}
