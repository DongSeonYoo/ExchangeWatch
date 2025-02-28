import { Module } from '@nestjs/common';
import { NotifiationHistoryModule } from './notification-histories/notification-histories.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';

@Module({
  imports: [NotifiationHistoryModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository],
  exports: [],
})
export class NotificationModule {}
