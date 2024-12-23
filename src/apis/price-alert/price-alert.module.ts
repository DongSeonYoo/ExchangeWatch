import { Module } from '@nestjs/common';
import { PriceAlertService } from './price-alert.service';
import { PriceAlertController } from './price-alert.controller';

@Module({
  controllers: [PriceAlertController],
  providers: [PriceAlertService],
})
export class PriceAlertModule {}
