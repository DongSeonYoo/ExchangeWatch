import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { IExchangeRateWebSocketService } from './interfaces/exchange-rate-websocket.interface';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';

@Injectable()
export class WebSocketManagerService
  implements IExchangeRateWebSocketService, OnModuleDestroy
{
  private activeService: IExchangeRateWebSocketService | null;
  private healthCheckInterval: NodeJS.Timeout | null;

  constructor(
    @Inject('PRIMARY_WEBSOCKET')
    private readonly primaryService: IExchangeRateWebSocketService,
    @Inject('FALLBACK_WEBSOCKET')
    private readonly secondaryService: IExchangeRateWebSocketService,
    private readonly loggerService: CustomLoggerService,
  ) {
    this.loggerService.context = WebSocketManagerService.name;
    this.activeService = this.primaryService;
  }

  onModuleDestroy() {
    this.disconnect();
  }

  connect(): void {
    this.loggerService.log('Connecting via Primary WebSocket Service...');
    this.activeService?.connect();
    this.startHealthCheck();
  }

  disconnect(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.activeService?.disconnect();
    this.activeService = null;
    this.loggerService.log('WebSocket Manager has been fully disconnected.');
  }

  isHealthy(): boolean {
    return this.activeService?.isHealthy() ?? false;
  }

  private startHealthCheck(): void {
    // 기존 메모리에 남아있는 헬스체크가 있다면, 초기화
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      if (!this.isHealthy()) {
        this.loggerService.warn(
          `Active WebSocket service is unhealthy. Attempting failover...`,
        );
        this.failover();
      }
    }, 10 * 1000);
  }

  private failover(): void {
    if (this.activeService === this.primaryService) {
      this.loggerService.log(
        'Failing over from Primary to Secondary WebSocket.',
      );

      // Primary 서비스는 이미 unhealthy 상태이므로, 바로 secondary로 교체
      this.activeService.disconnect();
      this.activeService = this.secondaryService;
      this.activeService.connect();

      this.loggerService.log('Failover to Secondary WebSocket initiated.');
      return;
    }

    // 만약 백업 서비스도 에러가 났다면 소켓연결 자체를 종료
    if (this.activeService === this.secondaryService) {
      this.loggerService.error(
        'Secondary WebSocket also failed. Shutting down all connections.',
      );
      this.disconnect();
      return;
    }
  }
}
