import { Module } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateController } from './exchange-rate.controller';
import { RedisModule } from '../../redis/redis.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchageRateScheduler } from './schedulers/exchange-rate.scheduler';
import { IsAfterConstraint } from '../../decorators/validations/is-after.validator';
import { ExchangeRateDailyRepository } from './repositores/exchange-rate-daily.repository';
import { IsBeforeThanConstraint } from '../../decorators/validations/is-before-than.validator';
import { ExternalAPIModule } from '../../externals/external.module';
import { LatestRateListener } from './listeners/latest-rate.listener';
import { ExchangeRateRawRepository } from './repositores/exchange-rate-raw.repository';
import { UpdateRateListener } from './listeners/update-rate.listener';
import { SseModule } from '../../sse/sse.module';

@Module({
  imports: [
    RedisModule,
    ExternalAPIModule,
    ScheduleModule.forRoot(),
    SseModule,
  ],
  controllers: [ExchangeRateController],
  providers: [
    ExchangeRateService,
    ExchageRateScheduler,
    ExchangeRateDailyRepository,
    ExchangeRateRawRepository,
    IsAfterConstraint,
    IsBeforeThanConstraint,
    LatestRateListener,
    UpdateRateListener,
  ],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}
