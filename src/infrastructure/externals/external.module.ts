import { Module } from '@nestjs/common';
import { CoinApiModule } from './exchange-rates/coin-api/coin-api.module';
import { ExternalWebSocketGateWay } from './external-websocket.gateway';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FrankFurterService } from './exchange-rates/frankfurter/frankfurter.service';
import { FixerService } from './exchange-rates/fixer/fixer.service';
import { CoinApiService } from './exchange-rates/coin-api/coin-api.service';

@Module({
  imports: [CoinApiModule.forRootAsync(), EventEmitterModule.forRoot()],
  providers: [
    {
      provide: 'LATEST_EXCHANGE_RATE_API',
      useClass: CoinApiService,
    },
    {
      provide: 'FLUCTUATION_RATE_API',
      useClass: CoinApiService,
    },
    {
      provide: 'TIMESERIES_RATE_API',
      useClass: FrankFurterService,
    },
    ExternalWebSocketGateWay,
  ],
  exports: [
    'LATEST_EXCHANGE_RATE_API',
    'FLUCTUATION_RATE_API',
    'TIMESERIES_RATE_API',
  ],
})
export class ExternalAPIModule {}
