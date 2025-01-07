import { Module } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateController } from './exchange-rate.controller';
import { FixerModule } from '../fixer/fixer.module';
import { RedisModule } from '../../redis/redis.module';
import { DateUtilModule } from '../../utils/date-util/date-util.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchageRateScheduler } from './schedulers/exchange-rate.scheduler';
import { ExchangeRateRepository } from './exchange-rate.repository';

@Module({
  imports: [FixerModule, RedisModule, DateUtilModule, ScheduleModule.forRoot()],
  controllers: [ExchangeRateController],
  providers: [
    ExchangeRateService,
    ExchageRateScheduler,
    ExchangeRateRepository,
  ],
})
export class ExchangeRateModule {}
