import { Module } from '@nestjs/common';
import { LatestRateSseService } from './services/latest-rate-sse.service';
import { SseController } from './sse.controller';

@Module({
  providers: [LatestRateSseService],
  exports: [LatestRateSseService],
  controllers: [SseController],
})
export class SseModule {}
