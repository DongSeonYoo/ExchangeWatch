import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateController } from '../../controllers/exchange-rate.controller';
import { ExternalAPIModule } from '../../../../infrastructure/externals/external.module';
import { ExchangeRateDailyRepository } from '../../repositories/exchange-rate-daily.repository';
import { DateUtilService } from '../../../../common/utils/date-util/date-util.service';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';
import { ExchangeRateService } from '../../services/exchange-rate.service';
import { ExchangeRateRawRepository } from '../../repositories/exchange-rate-raw.repository';
import { ExchangeRateRedisService } from '../../services/exchange-rate-redis.service';
import { DateUtilModule } from '../../../../common/utils/date-util/date-util.module';
import { AgenticaService } from '../../../../common/agents/agentica.service';

describe('ExchangeRateController', () => {
  let controller: ExchangeRateController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ...TestIntegrateModules.create(),
        ExternalAPIModule,
        DateUtilModule,
      ],
      controllers: [ExchangeRateController],
      providers: [
        ExchangeRateService,
        ExchangeRateDailyRepository,
        ExchangeRateRedisService,
        ExchangeRateRawRepository,
        DateUtilService,
        RedisService,
        AgenticaService,
      ],
    }).compile();

    controller = module.get(ExchangeRateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
