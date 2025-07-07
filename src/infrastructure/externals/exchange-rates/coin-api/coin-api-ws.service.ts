import { Injectable } from '@nestjs/common';
import { IExchangeRateWebSocketService } from '../interfaces/exchange-rate-websocket.interface';
import { WebSocket } from 'ws';
import { supportCurrencyList } from '../../../../modules/exchange-rate/constants/support-currency.constant';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/config.type';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CoinApiWebSocket } from './interfaces/coin-api-websocket.interface';
import { LatestRateEvent } from '../../../events/exchange-rate/latest-rate.event';
import { CustomLoggerService } from '../../../../common/logger/custom-logger.service';

@Injectable()
export class CoinApiWebSocketService implements IExchangeRateWebSocketService {
  private ws: WebSocket;
  private readonly conApiUrl: string;
  private readonly defaultBaseCurrency: string = 'KRW';
  private readonly majorCurrencyCode: string[] = supportCurrencyList;
  private readonly socketReceiveInterval: number = 60000;

  private lastHeartBeat: number | null = null;
  private connectionRetries: number = 0;
  private isPermantelyDead: boolean = false;

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.context = CoinApiWebSocketService.name;
    this.conApiUrl = this.configService.get('coinApi.baseUrl', {
      infer: true,
    });
  }

  connect(): void {
    this.ws = new WebSocket(this.conApiUrl, {
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
          heartbeat: true,
          subscribe_filter_asset_id: currencyPairs,
          subscribe_update_limit_ms_exrate: this.socketReceiveInterval,
        }),
      );
    });

    this.ws.on('message', async (data) => {
      const receivedData:
        | CoinApiWebSocket.ExchangeRateMessage
        | CoinApiWebSocket.HeartbeatMessage = JSON.parse(data.toString());

      if (receivedData.type === 'heartbeat') {
        this.lastHeartBeat = Number(receivedData.time) || Date.now();

        return;
      }

      if (
        receivedData.type === 'exrate' &&
        receivedData.asset_id_base === this.defaultBaseCurrency
      ) {
        this.eventEmitter.emit(
          LatestRateEvent.eventName,
          new LatestRateEvent(
            new Date(receivedData.time).getTime(),
            receivedData.asset_id_base,
            receivedData.asset_id_quote,
            receivedData.rate,
          ),
        );
      }
    });

    this.ws.on('close', () => {
      this.logger.debug('WebSocket release');

      // 3번 이상 재시도 시 그냥 연결 꺼버림
      if (this.connectionRetries >= 3) {
        this.isPermantelyDead = true;
        return;
      }

      this.connectionRetries++;
      setTimeout(() => this.connect(), 5000); // 연결 끊겼을시 재연결 로직
    });

    this.ws.on('error', (error) => {
      this.logger.error('WebSocket error', error.stack);
    });
  }

  /**
   * coinapi healthcheck method
   */
  isHealthy(): boolean {
    // 재연결하다가 영구적으로 죽었을 시
    if (this.isPermantelyDead) {
      return false;
    }

    // 소켓 연결상태 메롱이면
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    // 마지막 하트비트가 60초 이내에 수신되었는지 확인 (CoinAPI는 30초마다 보냄)
    if (this.lastHeartBeat && Date.now() - this.lastHeartBeat > 60000) {
      this.logger.warn('No heartbeat received in the last 60 seconds.');
      return false;
    }
    return true;
  }

  disconnect(): void {
    this.ws?.close();
    this.logger.info('Websocket connection closed');
  }
}
