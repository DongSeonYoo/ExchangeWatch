import { Module } from '@nestjs/common';
import { CoinApiModule } from './exchange-rates/coin-api/coin-api.module';
import { FrankFurterModule } from './exchange-rates/frankfurter/frankfurter.module';
import { CoinApiService } from './exchange-rates/coin-api/coin-api.service';
import { FrankFurterService } from './exchange-rates/frankfurter/frankfurter.service';

@Module({
  imports: [CoinApiModule.forRootAsync(), FrankFurterModule],
  providers: [
    {
      provide: 'LATEST_EXCHANGE_RATE_API',
      useClass: CoinApiService,
    },
    {
      provide: 'EXCHANGE_RATE_WEBSOCKET_API',
      useClass: CoinApiService,
    },
    {
      provide: 'FLUCTUATION_RATE_API',
      useClass: CoinApiService,
    },
  ],
  exports: [
    'LATEST_EXCHANGE_RATE_API',
    'EXCHANGE_RATE_WEBSOCKET_API',
    'FLUCTUATION_RATE_API',
  ],
})
export class ExternalAPIModule {}
