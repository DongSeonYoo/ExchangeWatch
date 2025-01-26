import { Test, TestingModule } from '@nestjs/testing';
import { ExchageRateScheduler } from '../../src/apis/exchange-rate/schedulers/exchange-rate.scheduler';
import { instance, mock, verify, when } from 'ts-mockito';
import { ExchangeRateService } from '../../src/apis/exchange-rate/exchange-rate.service';
import { DateUtilService } from '../../src/utils/date-util/date-util.service';

describe('ExchageRateScheduler', () => {
  let scheduler: ExchageRateScheduler;
  let exchangeRateService = mock(ExchangeRateService);
  let dateUtilService = mock(DateUtilService);

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

    dateUtilService = module.get<DateUtilService>(DateUtilService);
    scheduler = module.get<ExchageRateScheduler>(ExchageRateScheduler);
  });

  it('should be define', () => {
    expect(scheduler).toBeDefined();
  });

  describe('aggregateLatestRates', () => {
    it('should collect latest rates successfully', async () => {
      // arrange
      when(exchangeRateService.saveLatestRates()).thenResolve();

      // act
      await scheduler.aggregateLatestRates();

      // assert
      verify(exchangeRateService.saveLatestRates()).once();
    });

    it.todo('should handle error when collecting lates rates fails');
  });

  describe('aggregateDailyRates', () => {
    it('should aggregate daily rates successfully', async () => {
      // aggrange
      const today = new Date('2024-01-26');
      const yesterday = new Date('2025-01-25');

      // act
      when(dateUtilService.getYesterday()).thenReturn(yesterday);
      when(
        exchangeRateService.aggregateDailyRates(yesterday, today),
      ).thenResolve();
      await scheduler.aggregateDailyRates();

      // assert
      verify(exchangeRateService.aggregateDailyRates(yesterday, today)).once();
    });
    it.todo('should handle dulicate key error when aggregating daily rates');

    it.todo('should handle general error when aggregating daily rates');
  });
});
