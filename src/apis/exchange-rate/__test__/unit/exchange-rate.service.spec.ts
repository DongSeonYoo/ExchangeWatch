import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateService } from '../../exchange-rate.service';
import { ExchangeRateRepository } from '../../repositores/exchange-rate.repository';
import { ExchangeRateDailyRepository } from '../../repositores/exchange-rate-daily.repository';
import { DateUtilService } from '../../../../utils/date-util/date-util.service';
import { IExchangeRateAPIService } from '../../../../externals/exchange-rates/interfaces/exchange-rate-api-service';
import { MockProxy, mock } from 'jest-mock-extended';

describe('ExchangeRateService', () => {
  let exchangeRateService: ExchangeRateService;
  let exchangeRateExternalService: MockProxy<IExchangeRateAPIService>;
  let exchangeRateRepository: MockProxy<ExchangeRateRepository>;
  let exchangeRateDailyRepository: MockProxy<ExchangeRateDailyRepository>;
  let dateUtilService: MockProxy<DateUtilService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        {
          provide: ExchangeRateRepository,
          useValue: mock<ExchangeRateRepository>(),
        },
        {
          provide: ExchangeRateDailyRepository,
          useValue: mock<ExchangeRateDailyRepository>(),
        },
        {
          provide: 'EXCHANGE_RATE_API',
          useValue: mock<IExchangeRateAPIService>(),
        },
        {
          provide: DateUtilService,
          useValue: mock<DateUtilService>(),
        },
      ],
    }).compile();

    exchangeRateService = module.get(ExchangeRateService);
    exchangeRateExternalService = module.get('EXCHANGE_RATE_API');
    exchangeRateRepository = module.get(ExchangeRateRepository);
    exchangeRateDailyRepository = module.get(ExchangeRateDailyRepository);
    dateUtilService = module.get(DateUtilService);
  });

  it('should definded externalAPIService', () => {
    expect(exchangeRateExternalService).toBeDefined();
  });

  describe('getCurrencyExchangeRates', () => {
    it('should return aggregated lates exchange rates', async () => {
      // Arrange
      const baseCurrency = 'EUR';
      const currencyCodes = ['USD', 'KRW'];
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      dateUtilService.getYesterday.mockReturnValue(yesterday);
      exchangeRateExternalService.getLatestRates.mockResolvedValue({
        baseCurrency,
        date: today,
        rates: {
          USD: 1.048531,
          KRW: 1511.415692,
        },
      });
      exchangeRateExternalService.getFluctuationData.mockResolvedValue({
        startDate: yesterday,
        endDate: today,
        baseCurrency: baseCurrency,
        rates: {
          USD: {
            startRate: 1.039134,
            endRate: 1.046102,
            change: 0.007,
            changePct: 0.6706,
          },
          KRW: {
            startRate: 1509.986723,
            endRate: 1506.297246,
            change: -3.6895,
            changePct: -0.2443,
          },
        },
      });

      // Act
      const result = await exchangeRateService.getCurrencyExchangeRates({
        baseCurrency,
        currencyCodes,
      });

      // Assert
      expect(result.rates['USD'].rate).toEqual(1.048531);
      expect(result.rates['USD'].dayChange).toEqual(0.007);
      expect(result.rates['USD'].dayChangePercent).toEqual(0.6706);
      expect(result.rates['USD'].high24h).toEqual(1.046102);
      expect(result.rates['USD'].low24h).toEqual(1.039134);

      expect(result.rates['KRW'].rate).toEqual(1511.415692);
      expect(result.rates['KRW'].dayChange).toEqual(-3.6895);
      expect(result.rates['KRW'].dayChangePercent).toEqual(-0.2443);
      expect(result.rates['KRW'].high24h).toEqual(1509.986723);
      expect(result.rates['KRW'].low24h).toEqual(1506.297246);
    });
  });
});
