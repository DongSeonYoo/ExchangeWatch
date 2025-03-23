import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UpdateRateEvent } from '../../../events/exchange-rate/update-rate.event';
import { LatestRateSseService } from '../../../sse/services/latest-rate-sse.service';

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
