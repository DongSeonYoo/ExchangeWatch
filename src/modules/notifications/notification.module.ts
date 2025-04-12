import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { PriceNotificationService } from './services/price-notification.service';
import { NotificationRepository } from './notification.repository';
import { NotifiationHistoryModule } from '../notification-histories/notification-history.module';
import { NotificationTriggerService } from './services/notification-trigger.service';
import { NotificationHistoryRepository } from '../notification-histories/repositories/notification-history.repository';
import { FcmModule } from '../fcm/fcm.module';

@Module({
  imports: [FcmModule, NotifiationHistoryModule],
  controllers: [NotificationController],
  providers: [
    PriceNotificationService,
    NotificationTriggerService,
    NotificationRepository,
    NotificationHistoryRepository,
  ],
  exports: [NotificationTriggerService],
})
export class NotificationModule {}
