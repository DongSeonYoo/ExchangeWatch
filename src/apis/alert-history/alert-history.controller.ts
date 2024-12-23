import { Controller } from '@nestjs/common';
import { AlertHistoryService } from './alert-history.service';

@Controller('alert-history')
export class AlertHistoryController {
  constructor(private readonly alertHistoryService: AlertHistoryService) {}
}
