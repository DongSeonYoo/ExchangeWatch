import { Global, Module } from '@nestjs/common';
import { createLogger } from 'winston';
import { CustomLoggerService } from './custom-logger.service';
import { winstonConfig } from './config/wiston-logger.config';

@Global()
@Module({
  providers: [
    {
      provide: 'winston',
      useFactory: () => createLogger(winstonConfig),
    },
    CustomLoggerService,
  ],
  exports: [CustomLoggerService],
})
export class CustomLoggerModule {}
