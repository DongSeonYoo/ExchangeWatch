import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ExchangeRateService } from '../services/exchange-rate.service';
import { LatestRateEvent } from '../../../infrastructure/events/exchange-rate/latest-rate.event';

@Injectable()
export class LatestRateListener {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @OnEvent(LatestRateEvent.eventName)
  async handleLatestRateEvent(event: LatestRateEvent) {
    await this.exchangeRateService.processLatestRateFromWS(
      event.baseCurrency,
      event.currencyCode,
      event.rate,
      event.timestamp,
    );
  }
}
