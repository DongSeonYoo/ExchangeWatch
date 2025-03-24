import { Module } from '@nestjs/common';
import { CoinApiModule } from './exchange-rates/coin-api/coin-api.module';
import { CoinApiService } from './exchange-rates/coin-api/coin-api.service';
import { ExternalWebSocketGateWay } from './external-websocket.gateway';
import { EventEmitterModule } from '@nestjs/event-emitter';

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
    ExternalWebSocketGateWay,
  ],
  exports: ['LATEST_EXCHANGE_RATE_API', 'FLUCTUATION_RATE_API'],
})
export class ExternalAPIModule {}
