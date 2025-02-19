import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateService } from '../../exchange-rate.service';
import { ExchangeRateRepository } from '../../repositores/exchange-rate.repository';
import { ExchangeRateDailyRepository } from '../../repositores/exchange-rate-daily.repository';
import { DateUtilService } from '../../../../utils/date-util/date-util.service';
import { IExchangeRateAPIService } from '../../../../externals/exchange-rates/interfaces/exchange-rate-api-service';
import { MockProxy, mock } from 'jest-mock-extended';
import { supportCurrencyList } from '../../constants/support-currency.constant';
import typia from 'typia';
import { CurrentExchangeRateResDto } from '../../dto/exchange-rates.dto';

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
      const yesterday = new Date();

      dateUtilService.getYesterday.mockReturnValue(yesterday);
      exchangeRateExternalService.getLatestRates.mockResolvedValue({
        baseCurrency,
        date: today,
        rates: Object.fromEntries(
          currencyCodes.map((currency) => [currency, 1]),
        ),
      });
      exchangeRateExternalService.getFluctuationData.mockResolvedValue({
        baseCurrency,
        startDate: yesterday,
        endDate: today,
        rates: Object.fromEntries(
          currencyCodes.map((currency) => [
            currency,
            {
              startRate: 1,
              endRate: 1,
              change: 1,
              changePct: 1,
            },
          ]),
        ),
      });

      // Act
      const result = await exchangeRateService.getCurrencyExchangeRates({
        baseCurrency,
        currencyCodes,
      });

      // Assert
      expect(Object.keys(result.rates)).toEqual(
        expect.arrayContaining(currencyCodes),
      );
      expect(() =>
        typia.assert<CurrentExchangeRateResDto>(result),
      ).not.toThrow();
    });

    it('should return supported currencies in our services if currencyCodes is empty', async () => {
      // Arrange
      const baseCurrency = 'EUR';
      const currencyCodes = [];
      const supportedCurrencyList = supportCurrencyList;
      const today = new Date();
      const yesterday = new Date();

      exchangeRateExternalService.getLatestRates.mockResolvedValue({
        baseCurrency,
        date: today,
        rates: Object.fromEntries(
          supportedCurrencyList.map((currency) => [currency, 1]),
        ),
      });
      exchangeRateExternalService.getFluctuationData.mockResolvedValue({
        baseCurrency,
        startDate: yesterday,
        endDate: today,
        rates: Object.fromEntries(
          supportedCurrencyList.map((currency) => [
            currency,
            {
              startRate: 1,
              endRate: 1,
              change: 1,
              changePct: 1,
            },
          ]),
        ),
      });

      // Act
      const result = await exchangeRateService.getCurrencyExchangeRates({
        baseCurrency,
        currencyCodes,
      });

      // Assert
      expect(result.baseCurrency).toBe(baseCurrency);
      expect(Object.keys(result.rates)).not.toEqual(
        expect.arrayContaining(currencyCodes),
      );
      expect(Object.keys(result.rates)).toEqual(
        expect.arrayContaining(supportCurrencyList),
      );
      expect(() =>
        typia.assertEquals<CurrentExchangeRateResDto>(result),
      ).not.toThrow();
    });

    it.todo('hadnling external API(ratesRate)');

    it.todo('handling external API(fluctuationRate)');
  });
});
