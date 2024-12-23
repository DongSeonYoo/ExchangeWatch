import { Module } from '@nestjs/common';
import { AlertHistoryService } from './alert-history.service';
import { AlertHistoryController } from './alert-history.controller';

@Module({
  controllers: [AlertHistoryController],
  providers: [AlertHistoryService],
})
export class AlertHistoryModule {}
