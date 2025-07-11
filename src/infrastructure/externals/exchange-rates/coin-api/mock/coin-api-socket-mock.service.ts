import { Injectable } from '@nestjs/common';
import { IExchangeRateWebSocketService } from '../../interfaces/exchange-rate-websocket.interface';
import { interval, Subscription } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { supportCurrencyList } from '../../../../../modules/exchange-rate/constants/support-currency.constant';
import { LatestRateEvent } from '../../../../events/exchange-rate/latest-rate.event';

@Injectable()
export class CoinApiSocketMockService implements IExchangeRateWebSocketService {
  private subscription: Subscription | null = null;
  private readonly baseCurrency = 'KRW';
  private readonly initialRates: Record<string, number> = {};
  private readonly fluctuationRange = 0.005; // +-0.5% 정도 변동
  private readonly socketReceiveInterval: number = 60000;

  constructor(private readonly eventEmitter: EventEmitter2) {
    // 초기 레이트 셋팅 (대충 임의로 0.001 ~ 0.01 사이로 세팅)
    supportCurrencyList.forEach((currency) => {
      if (currency !== this.baseCurrency) {
        this.initialRates[currency] = 0.001 + Math.random() * 0.009;
      }
    });
  }

  /**
   * 테스트용 환율 데이터 생성 및 이벤트 발생 메서드
   * 실제 웹소켓 연결 없이 랜덤 환율 데이터를 생성하여 이벤트를 발생시킴
   */
  connect(): void {
    // 5초마다 환율 변동 시뮬레이션
    this.subscription = interval(this.socketReceiveInterval).subscribe(() => {
      const now = Date.now();
      for (const [currencyCode, baseRate] of Object.entries(
        this.initialRates,
      )) {
        // 약간의 변동을 줌
        const fluctuation =
          baseRate *
          (Math.random() * this.fluctuationRange * 2 - this.fluctuationRange);
        const newRate = baseRate + fluctuation;
        // 저장
        this.initialRates[currencyCode] = newRate;
        // 이벤트 발생
        this.eventEmitter.emit(
          LatestRateEvent.eventName,
          new LatestRateEvent(now, this.baseCurrency, currencyCode, newRate),
        );
      }
    });
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  // always true for dev..
  isHealthy(): boolean {
    return true;
  }
}
