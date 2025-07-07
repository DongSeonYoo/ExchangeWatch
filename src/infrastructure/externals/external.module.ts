import { Module } from '@nestjs/common';
import { CoinApiModule } from './exchange-rates/coin-api/coin-api.module';
import { ExternalWebSocketGateWay } from './external-websocket.gateway';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MockCurrencyLayerService } from './exchange-rates/currencylayer/mock/currencylayer-mock.service';
import { CoinApiSocketMockService } from './exchange-rates/coin-api/mock/coin-api-socket-mock.service';
import { CoinApiWebSocketService } from './exchange-rates/coin-api/coin-api-ws.service';
import { CoinApiService } from './exchange-rates/coin-api/coin-api.service';
import { FrankFurtherService } from './exchange-rates/frankfurther/frankfurther.service';
import { CurrencyLayerService } from './exchange-rates/currencylayer/currencylayer.service';

@Module({
  imports: [CoinApiModule.forRootAsync(), EventEmitterModule.forRoot()],
  providers: [
    {
      provide: 'LATEST_EXCHANGE_RATE_API',
      useClass: CoinApiService,
    },
    {
      provide: 'FLUCTUATION_RATE_API',
      useClass: CurrencyLayerService,
    },
    {
      provide: 'TIMESERIES_RATE_API',
      useClass: FrankFurtherService,
    },
    {
      provide: 'WEBSOCKET_IMPL',
      useClass: CoinApiWebSocketService,
    },
    {
      provide: 'HISTORICAL_RATE_API',
      useClass: CurrencyLayerService,
    },
    ExternalWebSocketGateWay,
  ],
  exports: [
    'LATEST_EXCHANGE_RATE_API',
    'FLUCTUATION_RATE_API',
    'TIMESERIES_RATE_API',
    'WEBSOCKET_IMPL',
    'HISTORICAL_RATE_API',
    ExternalWebSocketGateWay,
  ],
})
export class ExternalAPIModule {}
