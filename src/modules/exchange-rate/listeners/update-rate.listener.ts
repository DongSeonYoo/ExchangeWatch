import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LatestRateSseService } from '../../sse/services/latest-rate-sse.service';
import { UpdateRateEvent } from '../../../infrastructure/events/exchange-rate/update-rate.event';
import { NotificationTriggerService } from '../../notifications/services/notification-trigger.service';

@Injectable()
export class UpdateRateListener {
  constructor(
    private readonly exchangeRateSseService: LatestRateSseService,
    private readonly notificationTriggerService: NotificationTriggerService,
  ) {}

  /**
   * UpdateRateEvent 캐치 시 Notification Trigger.
   *
   * - SSE 실시간 전파
   * - 단순히 notification만 trigger
   *
   * @todo 추후 메세지브로커 설정 후 주입받아서 변경가능
   */
  @OnEvent(UpdateRateEvent.eventName)
  async handleUpdateRateEvent(event: UpdateRateEvent) {
    const { baseCurrency, data } = event;

    this.exchangeRateSseService.emitEvent(baseCurrency, data);

    await this.notificationTriggerService.handleTargetPriceTrigger(
      baseCurrency,
      data.currencyCode,
      data.rate,
    );
  }
}
