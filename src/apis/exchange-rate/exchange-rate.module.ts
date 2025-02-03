import { Module } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateController } from './exchange-rate.controller';
import { FixerModule } from '../fixer/fixer.module';
import { RedisModule } from '../../redis/redis.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchageRateScheduler } from './schedulers/exchange-rate.scheduler';
import { IsBeforeConstraint } from '../../decorators/validations/is-before.validator';
import { IsAfterConstraint } from '../../decorators/validations/is-after.validator';
import { ExchangeRateRepository } from './repositores/exchange-rate.repository';
import { ExchangeRateDailyRepository } from './repositores/exchange-rate-daily.repository';
import { FrankFurterModule } from '../frankfurter/frankfurter.module';

@Module({
  imports: [RedisModule, ScheduleModule.forRoot(), FrankFurterModule],
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
