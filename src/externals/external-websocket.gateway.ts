import WebSocket from 'ws';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../configs/config.type';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { supportCurrencyList } from '../apis/exchange-rate/constants/support-currency.constant';
import { CoinApiWebSocket } from './exchange-rates/coin-api/interfaces/coin-api-websocket.interface';
import { LatestRateEvent } from '../events/exchange-rate/latest-rate.event';

@Injectable()
export class ExternalWebSocketGateWay implements OnModuleInit {
  private ws: WebSocket;
  private readonly websocketUrl: string;
  private readonly baseCurrency: string = 'KRW';
  private readonly majorCurrencyCode: string[] = supportCurrencyList;
  private readonly logger: Logger = new Logger(ExternalWebSocketGateWay.name);

  onModuleInit() {
    this.connectSocket();
  }

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.websocketUrl = this.configService.get('coinApi.baseUrl', {
      infer: true,
    });
  }

  private connectSocket() {
    this.ws = new WebSocket(this.websocketUrl, {
      headers: {
        authorization: this.configService.get('coinApi.apiKey', {
          infer: true,
        }),
      },
    });

    this.ws.on('open', () => {
      this.logger.debug('@@coinapi websocket connected@@');

      const currencyPairs = this.majorCurrencyCode.map(
        (currency) => `${this.baseCurrency}/${currency}`,
      );
      this.ws.send(
        JSON.stringify({
          type: 'hello',
          heartbeat: false,
          subscribe_filter_asset_id: currencyPairs,
          subscribe_update_limit_ms_exrate: 5000,
        }),
      );

      this.ws.on('message', async (data) => {
        const priceData: CoinApiWebSocket.ExchangeRateMessage = JSON.parse(
          data.toString(),
        );

        if (priceData.type === 'exrate') {
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
    });

    this.ws.on('close', () => {
      this.logger.debug('WebSocket release');
      setTimeout(() => this.connectSocket(), 5000);
    });

    this.ws.on('error', (error) => {
      this.logger.error('WebSocket error', error);
    });
  }
}
