import { Module } from '@nestjs/common';
import { CoinApiModule } from './exchange-rates/coin-api/coin-api.module';
import { ExternalWebSocketGateWay } from './external-websocket.gateway';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FrankFurterService } from './exchange-rates/frankfurter/frankfurter.service';
import { MockCurrencyLayerService } from './exchange-rates/currencylayer/mock/currencylayer-mock.service';
import { CoinApiSocketMockService } from './exchange-rates/coin-api/mock/coin-api-socket-mock.service';

@Module({
  imports: [CoinApiModule.forRootAsync(), EventEmitterModule.forRoot()],
  providers: [
    {
      provide: 'LATEST_EXCHANGE_RATE_API',
      useClass: MockCurrencyLayerService,
    },
    {
      provide: 'FLUCTUATION_RATE_API',
      useClass: MockCurrencyLayerService,
    },
    {
      provide: 'TIMESERIES_RATE_API',
      useClass: FrankFurterService,
    },
    {
      provide: 'WEBSOCKET_IMPL',
      useClass: CoinApiSocketMockService,
    },
    ExternalWebSocketGateWay,
  ],
  exports: [
    'LATEST_EXCHANGE_RATE_API',
    'FLUCTUATION_RATE_API',
    'TIMESERIES_RATE_API',
    'WEBSOCKET_IMPL',
  ],
})
export class ExternalAPIModule {}
