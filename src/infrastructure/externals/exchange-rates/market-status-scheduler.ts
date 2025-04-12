import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ExternalWebSocketGateWay } from '../external-websocket.gateway';

@Injectable()
export class MarketStatusScheduler {
  private readonly logger = new Logger(MarketStatusScheduler.name);
  constructor(
    private readonly externalWebsocketGateWay: ExternalWebSocketGateWay,
  ) {}

  // 매주 일요일 21시 정각 (UTC)
  @Cron('0 21 * * 0')
  handleMarketOpen() {
    this.externalWebsocketGateWay.testConnectLatestRateSocket();
    this.logger.debug('시장 개장시간이라 latestRate 소켓연결을 시작합니다.');
  }

  //   매주 금요일 21시 정각
  @Cron('0 21 * * 5')
  handleMarketClose() {
    this.externalWebsocketGateWay.disconnectLatestRateSocket();
    this.logger.debug('시장 마감시간이라 latestRate 소켓연결을 해제합니다.');
  }
}
