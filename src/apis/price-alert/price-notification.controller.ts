import { Controller } from '@nestjs/common';
import { PriceNotificationService } from './price-notification.service';

@Controller('price-notification')
export class PriceNotificationController {
  constructor(private readonly priceAlertService: PriceNotificationService) {}

  /**
   * Create Notification
   */
}
