import { Module } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateController } from './exchange-rate.controller';
import { FixerModule } from '../fixer/fixer.module';
import { RedisModule } from '../../redis/redis.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchageRateScheduler } from './schedulers/exchange-rate.scheduler';
import { ExchangeRateRepository } from './exchange-rate.repository';
import { IsBeforeConstraint } from '../../decorators/validations/is-before.validator';
import { IsAfterConstraint } from '../../decorators/validations/is-after.validator';

@Module({
  imports: [FixerModule, RedisModule, ScheduleModule.forRoot()],
  controllers: [ExchangeRateController],
  providers: [
    ExchangeRateService,
    ExchageRateScheduler,
    ExchangeRateRepository,
    IsBeforeConstraint,
    IsAfterConstraint,
  ],
})
export class ExchangeRateModule {}
