import { Module } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateController } from './exchange-rate.controller';
import { RedisModule } from '../../redis/redis.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchageRateScheduler } from './schedulers/exchange-rate.scheduler';
import { IsBeforeConstraint } from '../../decorators/validations/is-before.validator';
import { IsAfterConstraint } from '../../decorators/validations/is-after.validator';
import { ExchangeRateRepository } from './repositores/exchange-rate.repository';
import { ExchangeRateDailyRepository } from './repositores/exchange-rate-daily.repository';
import { ExternalAPIModule } from '../../externals/external.module';

@Module({
  imports: [RedisModule, ScheduleModule.forRoot(), ExternalAPIModule],
  controllers: [ExchangeRateController],
  providers: [
    ExchangeRateService,
    ExchageRateScheduler,
    ExchangeRateRepository,
    ExchangeRateDailyRepository,
    IsBeforeConstraint,
    IsAfterConstraint,
  ],
})
export class ExchangeRateModule {}
