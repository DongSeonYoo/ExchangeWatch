import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduleManagerService } from './schedule-manager.service';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { DateUtilModule } from '../../common/utils/date-util/date-util.module';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { ClusterModule } from '../../infrastructure/cluster/cluster.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ExchangeRateModule,
    DateUtilModule,
    RedisModule,
    ClusterModule,
  ],
  providers: [ScheduleManagerService],
  exports: [ScheduleManagerService],
})
export class ScheduleManagerModule {}
