import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LatestRateSseService } from '../../sse/services/latest-rate-sse.service';
import { UpdateRateEvent } from '../../../infrastructure/events/exchange-rate/update-rate.event';

@Injectable()
export class UpdateRateListener {
  private readonly logger = new Logger(UpdateRateListener.name);
  constructor(private readonly exchangeRateSseService: LatestRateSseService) {}

  @OnEvent(UpdateRateEvent.eventName)
  handleUpdateRateEvent(event: UpdateRateEvent) {
    const { baseCurrency, data } = event;

    this.exchangeRateSseService.emitEvent(baseCurrency, data);
  }
}
