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
import { CurrentExchangeHistoryReqDto } from '../../dto/exchange-rates-history.dto';
import { ExchangeRatesDailyEntity } from '../../entitites/exchange-rate-daily.entity';

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

  describe('getHistoricalRates', () => {
    // given이 너무 비대하다... getHistoricalRates메서드의 책임이 너무 많음
    it('should feching missing data from external API when DB has partial data', async () => {
      // Arrage
      const input: CurrentExchangeHistoryReqDto = {
        baseCurrency: 'EUR',
        currencyCode: 'KRW',
        startedAt: new Date('2025-01-01'),
        endedAt: new Date('2025-01-03'),
      };

      dateUtilService.getDatesBeetween.mockReturnValueOnce([
        new Date('2025-01-01'),
        new Date('2025-01-02'),
        new Date('2025-01-03'),
      ]);

      exchangeRateDailyRepository.findDailyRates
        .mockResolvedValueOnce([
          {
            ohlcDate: new Date('2025-01-01'),
          } as ExchangeRatesDailyEntity,
          {
            ohlcDate: new Date('2025-01-02'),
          } as ExchangeRatesDailyEntity,
        ])
        .mockResolvedValueOnce([
          {
            ohlcDate: new Date('2025-01-01'),
          } as ExchangeRatesDailyEntity,
          {
            ohlcDate: new Date('2025-01-02'),
          } as ExchangeRatesDailyEntity,
          {
            ohlcDate: new Date('2025-01-03'),
          } as ExchangeRatesDailyEntity,
        ]);
      dateUtilService.getYesterday.mockReturnValueOnce(new Date('2025-01-02'));
      exchangeRateExternalService.getFluctuationData.mockResolvedValue({
        baseCurrency: input.baseCurrency,
        startDate: input.startedAt,
        endDate: input.endedAt,
        rates: {
          KRW: {
            startRate: 1,
            change: 1,
            changePct: 1,
            endRate: 1,
          },
        },
      });

      // Act
      const result = await exchangeRateService.getHistoricalRates(input);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map((e) => e.ohlcDate)).toEqual([
        new Date('2025-01-01'),
        new Date('2025-01-02'),
        new Date('2025-01-03'),
      ]);

      expect(
        exchangeRateExternalService.getFluctuationData,
      ).toHaveBeenCalledWith(
        new Date('2025-01-02'),
        new Date('2025-01-03'),
        'EUR',
        ['KRW'],
      );
    });

    it.todo(
      'should not fetching missing data from external API when DB has complete data',
    );
  });
});
