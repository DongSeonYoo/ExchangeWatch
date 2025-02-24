import { Injectable } from '@nestjs/common';
import { PriceNotificationRepository } from './repository/price-notification.repository';

@Injectable()
export class PriceNotificationService {
  constructor(
    private readonly priceNotificationRepository: PriceNotificationRepository,
  ) {}
}
