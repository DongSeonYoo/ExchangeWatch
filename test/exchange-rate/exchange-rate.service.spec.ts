import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateService } from '../../src/apis/exchange-rate/exchange-rate.service';
import { anyOfClass, instance, mock, verify, when } from 'ts-mockito';
import { MockFixerService } from '../../src/apis/fixer/mock/fixer-mock.service';
import { RedisService } from '../../src/redis/redis.service';
import { ExchangeRateRepository } from '../../src/apis/exchange-rate/repositores/exchange-rate.repository';
import { ExchangeRateDailyRepository } from '../../src/apis/exchange-rate/repositores/exchange-rate-daily.repository';
import { DateUtilService } from '../../src/utils/date-util/date-util.service';
import { ExchangeRateFixture } from './fixture/exchange-rate-fixture';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  let mockFixerService = mock(MockFixerService);
  let redisService = mock(RedisService);
  let exchangeRateRepository = mock(ExchangeRateRepository);
  let exchangeRateDailyRepository = mock(ExchangeRateDailyRepository);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        DateUtilService,
        {
          provide: MockFixerService,
          useValue: instance(mockFixerService),
        },
        {
          provide: RedisService,
          useValue: instance(redisService),
        },
        {
          provide: ExchangeRateRepository,
          useValue: instance(exchangeRateRepository),
        },
        {
          provide: ExchangeRateDailyRepository,
          useValue: instance(exchangeRateDailyRepository),
        },
      ],
    }).compile();

    service = module.get<ExchangeRateService>(ExchangeRateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrencyExchangeRates', () => {
    it('should return current rates with fluctuation from external api', async () => {
      // arrange
      const baseCurrency = 'EUR';
      const targetCodes = ['USD', 'KRW'];

      const latestRateRate = { USD: 1.1234, KRW: 1234.5 };
      const fluctuationRates = {
        USD: {
          start_rate: 1.1234,
          end_rate: 1.1334,
          change: 0.01,
          change_pct: 0.89,
        },
        KRW: {
          start_rate: 1234.56,
          end_rate: 1244.56,
          change: 10,
          change_pct: 0.81,
        },
      };

      const latestRatesResponse = ExchangeRateFixture.createLatestRates(
        baseCurrency,
        latestRateRate,
      );
      const mockFluctuationResponse =
        ExchangeRateFixture.createFluctuationRates(
          baseCurrency,
          fluctuationRates,
        );

      // act
      when(
        mockFixerService.getFluctuationRates(
          anyOfClass(Date),
          anyOfClass(Date),
          baseCurrency,
          targetCodes,
        ),
      ).thenResolve(mockFluctuationResponse);
      when(
        mockFixerService.getLatestRates(baseCurrency, targetCodes),
      ).thenResolve(latestRatesResponse);

      const result = await service.getCurrencyExchangeRates(
        baseCurrency,
        targetCodes,
      );

      // assert
      verify(mockFixerService.getLatestRates(baseCurrency, targetCodes)).once();
      verify(
        mockFixerService.getFluctuationRates(
          anyOfClass(Date),
          anyOfClass(Date),
          baseCurrency,
          targetCodes,
        ),
      ).once();

      expect(result.baseCurrency).toEqual(baseCurrency);
      targetCodes.map((targetCode) => {
        const late = latestRateRate[targetCode];
        const fluctuation = fluctuationRates[targetCode];

        expect(result.rates[targetCode]).toEqual({
          rate: late,
          dayChange: fluctuation.change,
          dayChangePercent: fluctuation.change_pct,
          high24h: Math.max(fluctuation.start_rate, fluctuation.end_rate),
          low24h: Math.min(fluctuation.start_rate, fluctuation.end_rate),
        });
      });
    });

    describe('when occured error about external API', () => {
      it.todo('should handle error when occured latestRates API');
      it.todo('should handle error when occured fluctuation API');
    });
  });
});
