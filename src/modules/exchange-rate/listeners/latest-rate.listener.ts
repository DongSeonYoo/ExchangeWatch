import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ExchangeRateService } from '../services/exchange-rate.service';
import { LatestRateEvent } from '../../../infrastructure/events/exchange-rate/latest-rate.event';
import { ExchangeRateRedisService } from '../services/exchange-rate-redis.service';

@Injectable()
export class LatestRateListener {
  constructor(
    private readonly exchangeRateRedisService: ExchangeRateRedisService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  /**
   * LatestRateEvent 수신 리스너
   *
   * - 소켓 수신 성공 시 헬스체크 업데이트
   * - 수신된 환율 데이터 처리
   *
   * 이 리스너는 데이터 유효성 검증이나 비즈니스 로직을 수행하지 않는다.
   * 오직 이벤트 전달과 최소한의 시스템 상태 갱신만 담당한다.
   */
  @OnEvent(LatestRateEvent.eventName)
  async handleLatestRateEvent(event: LatestRateEvent) {
    await this.exchangeRateRedisService.updateHealthCheck(event.baseCurrency);

    await this.exchangeRateService.handleLatestRateUpdate(
      event.baseCurrency,
      event.currencyCode,
      event.rate,
      event.timestamp,
    );
  }
}
