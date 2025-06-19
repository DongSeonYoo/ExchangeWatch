import { Module, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { ExchangeRateService } from './services/exchange-rate.service';
import { ExchangeRateController } from './controllers/exchange-rate.controller';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchangeRateScheduler } from './schedulers/exchange-rate.scheduler';
import { ExchangeRateDailyRepository } from './repositories/exchange-rate-daily.repository';
import { ExternalAPIModule } from '../../infrastructure/externals/external.module';
import { LatestRateListener } from './listeners/latest-rate.listener';
import { ExchangeRateRawRepository } from './repositories/exchange-rate-raw.repository';
import { UpdateRateListener } from './listeners/update-rate.listener';
import { IsAfterConstraint } from '../../common/decorators/validations/is-after.validator';
import { IsBeforeThanConstraint } from '../../common/decorators/validations/is-before-than.validator';
import { SseModule } from '../sse/sse.module';
import { ExchangeRateRedisService } from './services/exchange-rate-redis.service';
import { NotificationModule } from '../notifications/notification.module';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';
import { RoleService } from '../../infrastructure/cluster/role/role.service';

@Module({
  imports: [
    RedisModule,
    ExternalAPIModule,
    ScheduleModule.forRoot(),
    SseModule,
    NotificationModule,
  ],
  controllers: [ExchangeRateController],
  providers: [
    ExchangeRateService,
    ExchangeRateRedisService,
    ExchangeRateScheduler,
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
