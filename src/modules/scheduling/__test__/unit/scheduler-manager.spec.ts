import { Test, TestingModule } from '@nestjs/testing';
import { DateUtilService } from '../../../../common/utils/date-util/date-util.service';
import { ExchangeRateService } from '../../../exchange-rate/services/exchange-rate.service';
import { MockProxy } from 'jest-mock-extended';
import mock from 'jest-mock-extended/lib/Mock';
import { ScheduleManagerService } from '../../schedule-manager.service';
import { CustomLoggerService } from '../../../../common/logger/custom-logger.service';
import { LockManagerService } from '../../../../infrastructure/redis/lock-manager.service';

describe('ScheduleManagerService [unit]', () => {
  let scheduler: ScheduleManagerService;
  let exchangeRateService: MockProxy<ExchangeRateService>;
  let dateUtilService: MockProxy<DateUtilService>;
  let loggerService: MockProxy<CustomLoggerService>;
  let lockManagerService: MockProxy<LockManagerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleManagerService,
        {
          provide: ExchangeRateService,
          useValue: mock<ExchangeRateService>(),
        },
        {
          provide: DateUtilService,
          useValue: mock<DateUtilService>(),
        },
        {
          provide: CustomLoggerService,
          useValue: mock<CustomLoggerService>(),
        },
        {
          provide: LockManagerService,
          useValue: mock<LockManagerService>(),
        },
      ],
    }).compile();

    scheduler = module.get(ScheduleManagerService);
    dateUtilService = module.get(DateUtilService);
    exchangeRateService = module.get(ExchangeRateService);
    loggerService = module.get(CustomLoggerService);
    lockManagerService = module.get(LockManagerService);
  });

  it('should be define', () => {
    expect(scheduler).toBeDefined();
  });

  describe('aggregateDailyRates', () => {
    it.todo('should handle duplicate key error when aggregating daily rates');

    it.todo('should handle general error when aggregating daily rates');
  });
});
