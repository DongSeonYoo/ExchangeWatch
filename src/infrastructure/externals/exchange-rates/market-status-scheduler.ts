import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IExchangeRateWebSocketService } from './interfaces/exchange-rate-websocket.interface';

@Injectable()
export class MarketStatusScheduler {
  private readonly logger = new Logger(MarketStatusScheduler.name);
  constructor(
    @Inject('WEBSOCKET_IMPL')
    private readonly collectLatestRateSocket: IExchangeRateWebSocketService,
  ) {}

  // 매주 일요일 21시 정각 (UTC)
  @Cron('0 21 * * 0')
  handleMarketOpen() {
    // this.externalWebsocketGateWay.testConnectLatestRateSocketㅇ();
    this.collectLatestRateSocket.connect();
    this.logger.debug('시장 개장시간이라 latestRate 소켓연결을 시작합니다.');
  }

  //   매주 금요일 21시 정각
  @Cron('0 21 * * 5')
  handleMarketClose() {
    this.collectLatestRateSocket.disconnect();
    this.logger.debug('시장 마감시간이라 latestRate 소켓연결을 해제합니다.');
  }
}
