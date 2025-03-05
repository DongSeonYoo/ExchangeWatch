import { Module } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateController } from './exchange-rate.controller';
import { RedisModule } from '../../redis/redis.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchageRateScheduler } from './schedulers/exchange-rate.scheduler';
import { IsAfterConstraint } from '../../decorators/validations/is-after.validator';
import { ExchangeRateDailyRepository } from './repositores/exchange-rate-daily.repository';
import { ExternalAPIModule } from '../../externals/external.module';
import { IsBeforeThanConstraint } from '../../decorators/validations/is-before-than.validator';
import { ExchangeRateGateWay } from './exchange-rate.gateway';

@Module({
  imports: [RedisModule, ScheduleModule.forRoot(), ExternalAPIModule],
  controllers: [ExchangeRateController],
  providers: [
    ExchangeRateService,
    ExchageRateScheduler,
    ExchangeRateDailyRepository,
    IsAfterConstraint,
    IsBeforeThanConstraint,
    ExchangeRateGateWay,
  ],
})
export class ExchangeRateModule {}
