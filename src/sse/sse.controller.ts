import { Controller, Get, Query, Sse } from '@nestjs/common';
import { LatestRateSseService } from './services/latest-rate-sse.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('SSE')
@Controller('sse')
export class SseController {
  constructor(private readonly sseService: LatestRateSseService) {}

  @Sse('latest-rate')
  async latestRateSse(@Query('baseCurrency') baseCurrency: string) {
    return this.sseService.getLastRateObservable(baseCurrency);
  }
}
