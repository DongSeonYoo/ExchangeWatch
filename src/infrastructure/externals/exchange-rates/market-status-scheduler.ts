import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IExchangeRateWebSocketService } from './interfaces/exchange-rate-websocket.interface';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';

@Injectable()
export class MarketStatusScheduler {
  constructor(
    @Inject('WEBSOCKET_IMPL')
    private readonly collectLatestRateSocket: IExchangeRateWebSocketService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.context = MarketStatusScheduler.name;
  }

  // 매주 일요일 21시 정각 (UTC)
  @Cron('0 21 * * 0')
  handleMarketOpen() {
    this.collectLatestRateSocket.connect();
    this.logger.info('시장 개장시간이라 latestRate 소켓연결을 시작합니다.');
  }

  //   매주 금요일 21시 정각
  @Cron('0 21 * * 5')
  handleMarketClose() {
    this.collectLatestRateSocket.disconnect();
    this.logger.info('시장 마감시간이라 latestRate 소켓연결을 해제합니다.');
  }
}
