import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { NotifiationHistoryModule } from '../notification-histories/notification-history.module';

@Module({
  imports: [NotifiationHistoryModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository],
  exports: [],
})
export class NotificationModule {}
