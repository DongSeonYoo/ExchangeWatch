import { Controller } from '@nestjs/common';
import { PriceAlertService } from './price-alert.service';

@Controller('price-alert')
export class PriceAlertController {
  constructor(private readonly priceAlertService: PriceAlertService) {}
}
