import { Module } from '@nestjs/common';
import { FrankFurterService } from './exchange-rates/frankfurter/frankfurter.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  exports: ['EXCHANGE_RATE_API'],
  providers: [
    {
      provide: 'EXCHANGE_RATE_API',
      useClass: FrankFurterService,
    },
  ],
})
export class ExternalAPIModule {}
