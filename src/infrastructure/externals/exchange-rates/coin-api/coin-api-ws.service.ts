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
  private readonly maxConnectionRetriesCount = 3;

  private lastHeartBeat: number | null = null;
  private connectionRetriesCount: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

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
    // 기존 연결과 타이머 정리
    this.cleanup();

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
        this.connectionRetriesCount = 0;
        this.lastHeartBeat = Date.now(); // 연결 시 하트비트 초기화
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

    this.ws.on('close', (code, reason) => {
      // 의도적인 웹소켓 커넥션 종료라면 재연결 없이 그대로 종료
      if (code === 1000) {
        this.logger.debug(
          `WebSocket connection closed normally (code: ${code})`,
        );
        this.cleanup();
        return;
      }

      // 소켓연결이 예상치 못하게 종료되었으면 (네트워크 오류, 서버 문제 등)
      this.logger.warn(
        `WebSocket connection closed with code: ${code}${reason ? `, reason: ${reason}` : ''}`,
      );

      // 재연결 로직 시작
      if (this.connectionRetriesCount >= this.maxConnectionRetriesCount) {
        this.logger.error(
          `Maximum reconnection attempts (${this.maxConnectionRetriesCount}) reached, connection close.`,
        );
        this.cleanup();
        return;
      }

      this.connectionRetriesCount++;
      this.logger.debug(
        `Attempting to reconnect WebSocket (attempt ${this.connectionRetriesCount}/${this.maxConnectionRetriesCount})`,
      );

      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, this.maxConnectionRetriesCount);
      return;
    });

    this.ws.on('error', (error) => {
      this.logger.error('WebSocket error', error.stack);
      this.cleanup();
    });
  }

  isHealthy(): boolean {
    // 소켓 연결상태 메롱이면
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    // 마지막 하트비트가 수신된 적이 없거나, 마지막 하트비트가 60초 이상 지났으면 false
    if (!this.lastHeartBeat || Date.now() - this.lastHeartBeat > 60000) {
      if (this.lastHeartBeat) {
        // 하트비트가 있었는데 오래된 경우만 경고 로깅
        this.logger.warn('No heartbeat received in the last 60 seconds.');
      }
      return false;
    }

    return true;
  }

  disconnect(): void {
    this.cleanup();
    this.logger.info('Disconnect method called for Websocket.');
  }

  private cleanup(): void {
    // 혹시모를  재연결 타이머 정리
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // 기존 WebSocket 연결 정리
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000);
      }

      // 이벤트 리스너 제거하여 메모리 누수 방지
      this.ws.removeAllListeners();
    }

    // 상태 초기화
    this.lastHeartBeat = null;
    this.logger.debug('Exists socket connections cleanup successfully');
  }
}
