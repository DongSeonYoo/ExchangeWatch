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
      setTimeout(() => this.connect(), 5000); // 연결 끊겼을시 재연결 로직
    });

    this.ws.on('error', (error) => {
      this.logger.error('WebSocket error', error.stack);
    });
  }

  disconnect(): void {
    this.ws?.close();
    this.logger.info('Websocket connection closed');
  }
}
