import { Module } from '@nestjs/common';
import { PriceNotificationService } from './price-notification.service';
import { PriceNotificationController } from './price-notification.controller';
import { PriceNotificationRepository } from './repository/price-notification.repository';

@Module({
  controllers: [PriceNotificationController],
  providers: [PriceNotificationService, PriceNotificationRepository],
})
export class PriceNotificationModule {}
