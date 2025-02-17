import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MockCurrencyLayerService } from './exchange-rates/currencylayer/mock/currencylayer-mock.service';

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
      useClass: MockCurrencyLayerService,
    },
  ],
})
export class ExternalAPIModule {}
