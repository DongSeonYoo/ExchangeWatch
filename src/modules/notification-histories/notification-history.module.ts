import { Module } from '@nestjs/common';
import { NotificationHistoryRepository } from './repositories/notification-history.repository';
import { NotificationHistoryService } from './notification-history.service';

@Module({
  imports: [],
  providers: [NotificationHistoryService, NotificationHistoryRepository],
  exports: [NotificationHistoryService],
})
export class NotifiationHistoryModule {}
