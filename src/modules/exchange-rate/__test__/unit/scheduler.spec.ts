import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateScheduler } from '../../schedulers/exchange-rate.scheduler';
import { DateUtilService } from '../../../../common/utils/date-util/date-util.service';
import { ExchangeRateService } from '../../services/exchange-rate.service';
import { MockProxy } from 'jest-mock-extended';
import mock from 'jest-mock-extended/lib/Mock';

describe('ExchageRateScheduler', () => {
  let scheduler: ExchangeRateScheduler;
  let exchangeRateService: MockProxy<ExchangeRateService>;
  let dateUtilService: MockProxy<DateUtilService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateScheduler,
        {
          provide: ExchangeRateService,
          useValue: mock<ExchangeRateService>(),
        },
        {
          provide: DateUtilService,
          useValue: mock<DateUtilService>(),
        },
      ],
    }).compile();

    scheduler = module.get(ExchangeRateScheduler);
    dateUtilService = module.get(DateUtilService);
  });

  it('should be define', () => {
    expect(scheduler).toBeDefined();
  });

  describe('aggregateLatestRates', () => {
    it.todo('should handle error when collecting lates rates fails');
  });

  describe('aggregateDailyRates', () => {
    it.todo('should handle dulicate key error when aggregating daily rates');

    it.todo('should handle general error when aggregating daily rates');
  });
});
