import { Global, Module } from '@nestjs/common';
import { createLogger } from 'winston';
import { CustomLoggerService } from './custom-logger.service';
import { winstonConfig } from './config/wiston-logger.config';
import { LoggerRepository } from './logger.repository';

@Global()
@Module({
  providers: [
    {
      provide: 'winston',
      useFactory: () => createLogger(winstonConfig),
    },
    CustomLoggerService,
    LoggerRepository,
  ],
  exports: [CustomLoggerService],
})
export class CustomLoggerModule {}
