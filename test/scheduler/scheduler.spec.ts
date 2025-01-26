import { Test, TestingModule } from '@nestjs/testing';
import { ExchageRateScheduler } from '../../src/apis/exchange-rate/schedulers/exchange-rate.scheduler';
import { instance, mock } from 'ts-mockito';
import { ExchangeRateService } from '../../src/apis/exchange-rate/exchange-rate.service';
import { DateUtilService } from '../../src/utils/date-util/date-util.service';

describe('ExchageRateScheduler', () => {
  let scheduler: ExchageRateScheduler;
  let exchangeRateService = mock(ExchangeRateService);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchageRateScheduler,
        DateUtilService,
        {
          provide: ExchangeRateService,
          useValue: instance(exchangeRateService),
        },
      ],
    }).compile();

    scheduler = module.get<ExchageRateScheduler>(ExchageRateScheduler);
  });

  it('should be define', () => {
    expect(scheduler).toBeDefined();
  });
});
