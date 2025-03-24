import { Test, TestingModule } from '@nestjs/testing';
import { ExchageRateScheduler } from '../../schedulers/exchange-rate.scheduler';
import { instance, mock } from 'ts-mockito';
import { DateUtilService } from '../../../../common/utils/date-util/date-util.service';
import { ExchangeRateService } from '../../services/exchange-rate.service';

describe('ExchageRateScheduler', () => {
  let scheduler: ExchageRateScheduler;
  let exchangeRateService = mock(ExchangeRateService);
  let dateUtilService = mock(DateUtilService);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchageRateScheduler,
        {
          provide: ExchangeRateService,
          useValue: instance(exchangeRateService),
        },
        {
          provide: DateUtilService,
          useValue: instance(dateUtilService),
        },
      ],
    }).compile();

    scheduler = module.get(ExchageRateScheduler);
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
