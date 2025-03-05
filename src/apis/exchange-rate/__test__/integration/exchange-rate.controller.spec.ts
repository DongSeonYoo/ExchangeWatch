import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateController } from '../../exchange-rate.controller';
import { ExchangeRateService } from '../../exchange-rate.service';
import { ExternalAPIModule } from '../../../../externals/external.module';
import { ExchangeRateDailyRepository } from '../../repositores/exchange-rate-daily.repository';
import { DateUtilService } from '../../../../utils/date-util/date-util.service';
import { RedisService } from '../../../../redis/redis.service';
import { Logger } from '@nestjs/common';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';

describe('ExchangeRateController', () => {
  let controller: ExchangeRateController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create(), ExternalAPIModule],
      controllers: [ExchangeRateController],
      providers: [
        ExchangeRateService,
        ExchangeRateDailyRepository,
        DateUtilService,
        RedisService,
        Logger,
      ],
    }).compile();

    controller = module.get(ExchangeRateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
