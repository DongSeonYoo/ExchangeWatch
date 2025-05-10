import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IExchangeRateWebSocketService } from './exchange-rates/interfaces/exchange-rate-websocket.interface';
import { DateUtilService } from '../../common/utils/date-util/date-util.service';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';

@Injectable()
export class ExternalWebSocketGateWay implements OnModuleInit {
  constructor(
    @Inject('WEBSOCKET_IMPL')
    private readonly collectLatestRateSocket: IExchangeRateWebSocketService,
    private readonly dateUtilService: DateUtilService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.context = ExternalWebSocketGateWay.name;
  }

  onModuleInit() {
    if (this.dateUtilService.isMarketOpen()) {
      this.logger.debug('[개장]: 실시간 환율정보 수집');
      this.collectLatestRateSocket.connect();
    } else {
      this.logger.debug('[휴장]: 실시간 환율정보 수집 연결하지 않음');
    }
  }
}
