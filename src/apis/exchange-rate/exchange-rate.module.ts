import { Module } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateController } from './exchange-rate.controller';
import { FixerModule } from '../fixer/fixer.module';
import { RedisModule } from '../../redis/redis.module';
import { DateUtilModule } from '../../utils/date-util/date-util.module';

@Module({
  imports: [FixerModule, RedisModule, DateUtilModule],
  controllers: [ExchangeRateController],
  providers: [ExchangeRateService],
})
export class ExchangeRateModule {}
