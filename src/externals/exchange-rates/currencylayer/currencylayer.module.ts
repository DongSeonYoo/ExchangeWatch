import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MockCurrencyLayerService } from './mock/currencylayer-mock.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [MockCurrencyLayerService],
  exports: [MockCurrencyLayerService],
})
export class CurrencyLayerModule {}
