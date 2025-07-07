import { Inject, Injectable } from '@nestjs/common';
import { IExchangeRateWebSocketService } from './interfaces/exchange-rate-websocket.interface';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';

@Injectable()
export class WebSocketManagerService implements IExchangeRateWebSocketService {
  private primary: IExchangeRateWebSocketService;
  private secondary: IExchangeRateWebSocketService;
  private activeService: IExchangeRateWebSocketService | null;
  private healthCheckInterval: NodeJS.Timeout;

  constructor(
    @Inject('PRIMARY_WEBSOCKET')
    primaryService: IExchangeRateWebSocketService,
    @Inject('FALLBACK_WEBSOCKET')
    fallbackService: IExchangeRateWebSocketService,
    private readonly loggerService: CustomLoggerService,
  ) {
    this.primary = primaryService;
    this.secondary = fallbackService;

    // setting active socket service
    this.activeService = this.primary;
  }

  connect(): void {
    this.loggerService.log('Connecting via Primary WebSocket Service...');
    this.activeService?.connect();
    this.startHealthCheck(); // 연결 시작과 동시에 상태 감시 시작
  }

  disconnect(): void {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    this.activeService?.disconnect();
  }

  isHealthy(): boolean | null {
    return this.activeService?.isHealthy() ?? null; // <- 이건 애반데
  }

  private startHealthCheck(): void {
    // 30초마다 활성 서비스의 상태를 체크
    this.healthCheckInterval = setInterval(() => {
      if (!this.activeService?.isHealthy()) {
        this.loggerService.warn(
          `Active WebSocket service is unhealthy. Attempting failover...`,
        );
        this.failover();
      }
    }, 30 * 1000);
  }

  private failover(): void {
    // 현재 활성 서비스가 1순위였지만 failover시, 2순위로 전환, 컨텍스트도 변경
    if (this.activeService === this.primary) {
      this.loggerService.log(
        'Failing over from Primary to Secondary WebSocket.',
      );
      this.primary.disconnect();
      this.activeService = this.secondary;
      this.activeService.connect();
    } else {
      // 2순위마저 실패한 경우, 아예 소켓연결 종료
      this.primary.disconnect();
      this.secondary.disconnect();

      this.activeService?.disconnect();
      this.activeService = null;

      this.loggerService.warn('Secondary WebSocket failed!');
    }
  }
}
