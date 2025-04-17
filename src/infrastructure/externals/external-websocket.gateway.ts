import WebSocket from 'ws';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/config.type';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { supportCurrencyList } from '../../modules/exchange-rate/constants/support-currency.constant';
import { CoinApiWebSocket } from './exchange-rates/coin-api/interfaces/coin-api-websocket.interface';
import { interval, Subscription } from 'rxjs';
import { LatestRateEvent } from '../events/exchange-rate/latest-rate.event';
import { DateUtilService } from '../../common/utils/date-util/date-util.service';

@Injectable()
export class ExternalWebSocketGateWay implements OnModuleInit {
  private ws: WebSocket;
  private readonly websocketUrl: string;
  private readonly defaultBaseCurrency: string = 'KRW';
  private readonly majorCurrencyCode: string[] = supportCurrencyList;
  private readonly logger: Logger = new Logger(ExternalWebSocketGateWay.name);
  private intervalSubscription: Subscription;

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly eventEmitter: EventEmitter2,
    private readonly dateUtilService: DateUtilService,
  ) {
    this.websocketUrl = this.configService.get('coinApi.baseUrl', {
      infer: true,
    });
  }

  onModuleInit() {
    if (this.dateUtilService.isMarketOpen()) {
      this.connectLatestRateSocket();
    } else {
      this.disconnectLatestRateSocket();
    }
  }

  /**
   * 테스트용 환율 데이터 생성 및 이벤트 발생 메서드
   * 실제 웹소켓 연결 없이 랜덤 환율 데이터를 생성하여 이벤트를 발생시킴
   */
  testConnectLatestRateSocket() {
    this.logger.debug('테스트 웹소켓 시뮬레이션 시작 (KRW/EUR)');

    // 기준 환율 (KRW/EUR)
    const baseRate = 0.06675258830083569;

    // 5초마다 데이터 생성 및 이벤트 발생
    this.intervalSubscription = interval(5000).subscribe(() => {
      // 현재 환율 = 기준 환율 +/- 최대 1% 변동
      const fluctuation = baseRate * (Math.random() * 0.02 - 0.01);
      const rate = baseRate + fluctuation;

      // 타임스탬프는 현재 시간으로
      const timestamp = Date.now();

      this.logger.debug(
        `테스트 환율 이벤트 발생: KRW/EUR = ${rate.toFixed(4)}`,
      );

      // 이벤트 발생
      this.eventEmitter.emit(
        LatestRateEvent.eventName,
        new LatestRateEvent(timestamp, 'KRW', 'EUR', rate),
      );
    });
  }

  connectLatestRateSocket() {
    this.ws = new WebSocket(this.websocketUrl, {
      headers: {
        authorization: this.configService.get('coinApi.apiKey', {
          infer: true,
        }),
      },
    });

    this.ws.on('open', () => {
      this.logger.debug('@@coinapi websocket connected@@');

      const currencyPairs = this.majorCurrencyCode
        .filter((currency) => currency !== this.defaultBaseCurrency) // KRW/KRW 방지
        .map((currency) => `${this.defaultBaseCurrency}/${currency}`);
      this.ws.send(
        JSON.stringify({
          type: 'hello',
          heartbeat: false,
          subscribe_filter_asset_id: currencyPairs,
          subscribe_update_limit_ms_exrate: 5000,
        }),
      );
    });

    this.ws.on('message', async (data) => {
      const priceData: CoinApiWebSocket.ExchangeRateMessage = JSON.parse(
        data.toString(),
      );

      if (
        priceData.type === 'exrate' &&
        priceData.asset_id_base === this.defaultBaseCurrency
      ) {
        this.eventEmitter.emit(
          LatestRateEvent.eventName,
          new LatestRateEvent(
            new Date(priceData.time).getTime(),
            priceData.asset_id_base,
            priceData.asset_id_quote,
            priceData.rate,
          ),
        );
      }
    });

    this.ws.on('close', () => {
      this.logger.debug('WebSocket release');
      setTimeout(() => this.connectLatestRateSocket(), 5000);
    });

    this.ws.on('error', (error) => {
      this.logger.error('WebSocket error', error);
    });
  }

  disconnectLatestRateSocket() {
    this.ws?.close();
    this.logger.log('Websocket connection closed');
  }
}
