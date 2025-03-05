import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateService } from '../../exchange-rate.service';
import { ExchangeRateDailyRepository } from '../../repositores/exchange-rate-daily.repository';
import { DateUtilService } from '../../../../utils/date-util/date-util.service';
import {
  IFluctuationExchangeRateApi,
  ILatestExchangeRateApi,
} from '../../../../externals/exchange-rates/interfaces/exchange-rate-rest-api.interface';
import { MockProxy, mock } from 'jest-mock-extended';
import { supportCurrencyList } from '../../constants/support-currency.constant';
import typia from 'typia';
import { CurrentExchangeRateResDto } from '../../dto/exchange-rates.dto';
import { CurrentExchangeHistoryReqDto } from '../../dto/exchange-rates-history.dto';
import { ExchangeRatesDailyEntity } from '../../entitites/exchange-rate-daily.entity';
import { IExchangeRateDaily } from '../../interface/exchange-rate-daily.interface';
import { ExchangeRateFixture } from '../fixture/exchange-rate-fixture';

describe('ExchangeRateService', () => {
  let exchangeRateService: ExchangeRateService;

  let latestExchangeRateApi: MockProxy<ILatestExchangeRateApi>;
  let fluctuationExchangeRateApi: MockProxy<IFluctuationExchangeRateApi>;

  let exchangeRateDailyRepository: MockProxy<ExchangeRateDailyRepository>;
  let dateUtilService: MockProxy<DateUtilService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        {
          provide: 'LATEST_EXCHANGE_RATE_API',
          useValue: mock<ILatestExchangeRateApi>(),
        },
        {
          provide: 'FLUCTUATION_RATE_API',
          useValue: mock<IFluctuationExchangeRateApi>(),
        },
        {
          provide: ExchangeRateDailyRepository,
          useValue: mock<ExchangeRateDailyRepository>(),
        },
        {
          provide: DateUtilService,
          useValue: mock<DateUtilService>(),
        },
      ],
    }).compile();

    exchangeRateService = module.get(ExchangeRateService);

    latestExchangeRateApi = module.get('LATEST_EXCHANGE_RATE_API');
    fluctuationExchangeRateApi = module.get('FLUCTUATION_RATE_API');

    exchangeRateDailyRepository = module.get(ExchangeRateDailyRepository);
    dateUtilService = module.get(DateUtilService);
  });

  it('should definded externalAPIService', () => {
    expect(latestExchangeRateApi).toBeDefined();
    expect(fluctuationExchangeRateApi).toBeDefined();
  });

  describe('getCurrencyExchangeRates', () => {
    it('should return aggregated lates exchange rates', async () => {
      // Arrange
      const baseCurrency = 'EUR';
      const currencyCodes = ['USD', 'KRW'];
      const today = new Date();
      const yesterday = new Date();
      const latestRatesResponse = ExchangeRateFixture.createLatestRates('EUR', {
        USD: 1.1,
        KRW: 0.8,
      });
      const fluctuationRatesRepsonse =
        ExchangeRateFixture.createFluctuationRates(
          baseCurrency,
          yesterday,
          today,
          {
            USD: {
              startRate: 1,
              endRate: 1,
              change: 1,
              changePct: 1,
              highRate: 2,
              lowRate: 1.5,
            },
            KRW: {
              startRate: 1,
              endRate: 1,
              change: 1,
              changePct: 1,
              highRate: 2,
              lowRate: 1.5,
            },
          },
        );

      dateUtilService.getYesterday.mockReturnValue(yesterday);
      latestExchangeRateApi.getLatestRates.mockResolvedValue(
        latestRatesResponse,
      );
      fluctuationExchangeRateApi.getFluctuationData.mockResolvedValue(
        fluctuationRatesRepsonse,
      );

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

      const mockLatestRates = ExchangeRateFixture.createLatestRates(
        baseCurrency,
        Object.fromEntries(
          supportedCurrencyList.map((currency) => [currency, 1]),
        ),
      );
      const mockFluctuation = ExchangeRateFixture.createFluctuationRates(
        baseCurrency,
        yesterday,
        today,
        Object.fromEntries(
          supportedCurrencyList.map((currency) => [
            currency,
            {
              startRate: 1,
              endRate: 1,
              change: 1,
              changePct: 1,
              highRate: 2,
              lowRate: 1.5,
            },
          ]),
        ),
      );

      latestExchangeRateApi.getLatestRates.mockResolvedValue(mockLatestRates);
      fluctuationExchangeRateApi.getFluctuationData.mockResolvedValue(
        mockFluctuation,
      );

      // Act
      const result = await exchangeRateService.getCurrencyExchangeRates({
        baseCurrency,
        currencyCodes,
      });

      // Assert
      expect(result.baseCurrency).toBe(baseCurrency);
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
    describe('when DB has partial data', () => {
      it('should fetch missing data from the external API', async () => {
        // Arrange
        const input: CurrentExchangeHistoryReqDto = {
          baseCurrency: 'EUR',
          currencyCode: 'KRW',
          startedAt: new Date('2025-01-01'),
          endedAt: new Date('2025-01-04'),
        };
        const requestedDates = [
          new Date('2025-01-01'),
          new Date('2025-01-02'),
          new Date('2025-01-03'),
          new Date('2025-01-04'),
        ];
        const existingDates = [new Date('2025-01-01'), new Date('2025-01-02')];
        const missingDates = [new Date('2025-01-03'), new Date('2025-01-04')];

        dateUtilService.getDatesBeetween.mockReturnValue(requestedDates);
        missingDates.forEach((date) => {
          dateUtilService.getYesterday.mockReturnValueOnce(date);
        });

        exchangeRateDailyRepository.findDailyRates
          .mockResolvedValueOnce(
            existingDates.map((ohlcDate) => ({
              ohlcDate,
            })) as ExchangeRatesDailyEntity[],
          )
          .mockResolvedValueOnce(
            requestedDates.map((ohlcDate) => ({
              ohlcDate,
            })) as ExchangeRatesDailyEntity[],
          );

        // mocking as many as missDates
        fluctuationExchangeRateApi.getFluctuationData.mockResolvedValue(
          ExchangeRateFixture.createFluctuationRates(
            'EUR',
            new Date('2025-01-01'),
            new Date('2025-01-04'),
            {
              KRW: {
                startRate: 1,
                endRate: 1,
                change: 1,
                changePct: 1,
                highRate: 2,
                lowRate: 1.5,
              },
            },
          ),
        );

        const fluctuationAPIspy = jest.spyOn(
          fluctuationExchangeRateApi,
          'getFluctuationData',
        );
        const dailyRepositorySpy = jest.spyOn(
          exchangeRateDailyRepository,
          'saveDailyRates',
        );

        // Act
        const act = await exchangeRateService.getHistoricalRates(input);

        // Assert
        expect(fluctuationAPIspy).toHaveBeenCalledTimes(1);
        expect(fluctuationAPIspy).toHaveBeenCalledWith(
          missingDates[0],
          missingDates[missingDates.length - 1],
          'EUR',
          ['KRW'],
        );

        expect(act).toHaveLength(requestedDates.length);
        expect(() =>
          typia.assert<IExchangeRateDaily.ICreate[]>(
            dailyRepositorySpy.mock.calls[0][0],
          ),
        ).not.toThrow();
      });

      it('should insert missing data from the external API into the DB', async () => {
        // Arrange
        const input: CurrentExchangeHistoryReqDto = {
          baseCurrency: 'EUR',
          currencyCode: 'KRW',
          startedAt: new Date('2025-01-01'),
          endedAt: new Date('2025-01-04'),
        };
        const requestedDates = [
          new Date('2025-01-01'),
          new Date('2025-01-02'),
          new Date('2025-01-03'),
          new Date('2025-01-04'),
        ];
        const existingDates: Date[] = [];
        const missingDates = [
          new Date('2025-01-01'),
          new Date('2025-01-02'),
          new Date('2025-01-03'),
          new Date('2025-01-04'),
        ];

        dateUtilService.getDatesBeetween.mockReturnValue(requestedDates);

        missingDates.forEach((date) => {
          dateUtilService.getYesterday.mockReturnValueOnce(date);
        });

        exchangeRateDailyRepository.findDailyRates
          .mockResolvedValueOnce(
            existingDates.map((ohlcDate) => ({
              ohlcDate,
            })) as ExchangeRatesDailyEntity[],
          )
          .mockResolvedValueOnce(
            requestedDates.map((ohlcDate) => ({
              ohlcDate,
            })) as ExchangeRatesDailyEntity[],
          );

        // mocking as many as missDates
        fluctuationExchangeRateApi.getFluctuationData.mockResolvedValue(
          ExchangeRateFixture.createFluctuationRates(
            'EUR',
            new Date('2025-01-01'),
            new Date('2025-01-04'),
            {
              KRW: {
                startRate: 1,
                endRate: 1,
                change: 1,
                changePct: 1,
                highRate: 2,
                lowRate: 1.5,
              },
            },
          ),
        );

        const dailyRepositorySpy = jest.spyOn(
          exchangeRateDailyRepository,
          'saveDailyRates',
        );

        // Act
        const result = await exchangeRateService.getHistoricalRates(input);

        // Assert
        expect(result).toHaveLength(requestedDates.length);
        expect(() =>
          typia.assert<IExchangeRateDaily.ICreate[]>(
            dailyRepositorySpy.mock.calls[0][0],
          ),
        ).not.toThrow();
      });
    });

    describe('when DB has complete data', () => {
      it('should not fetch data from external API', async () => {
        // Arrange
        const input: CurrentExchangeHistoryReqDto = {
          baseCurrency: 'EUR',
          currencyCode: 'KRW',
          startedAt: new Date('2025-01-01'),
          endedAt: new Date('2025-01-04'),
        };
        const requestedDates = [
          new Date('2025-01-01'),
          new Date('2025-01-02'),
          new Date('2025-01-03'),
          new Date('2025-01-04'),
        ];
        const existingDates = requestedDates;
        const missingDates: Date[] = [];

        dateUtilService.getDatesBeetween.mockReturnValue(requestedDates);

        exchangeRateDailyRepository.findDailyRates.mockResolvedValueOnce(
          existingDates.map((ohlcDate) => ({
            ohlcDate,
          })) as ExchangeRatesDailyEntity[],
        );

        const externalAPISpy = jest.spyOn(
          fluctuationExchangeRateApi,
          'getFluctuationData',
        );

        // Act
        const result = await exchangeRateService.getHistoricalRates(input);

        // Assert
        expect(externalAPISpy).not.toHaveBeenCalled();
        expect(result).toHaveLength(requestedDates.length);
      });
    });
  });

  describe('calculateDailyRates', () => {
    describe('should save daily rates into exchangeRateDaily from external API', () => {
      it.todo('should call external api 31 times (supportCurrencies count) ');

      it.todo(
        'should convert the recived data according to the entity structure',
      );

      it.todo('should save recived data into the DB');
    });
  });

  describe('getCurrencyPairs', () => {
    it('should generate correct currency pairs', () => {
      // Arrange
      const testList = ['USD', 'EUR', 'KRW'];

      // Act
      const result = exchangeRateService.generateCurrencyPairs(testList);

      // Assert
      expect(result).toEqual([
        { baseCurrency: 'USD', currencyCode: 'EUR' },
        { baseCurrency: 'USD', currencyCode: 'KRW' },
        { baseCurrency: 'EUR', currencyCode: 'USD' },
        { baseCurrency: 'EUR', currencyCode: 'KRW' },
        { baseCurrency: 'KRW', currencyCode: 'USD' },
        { baseCurrency: 'KRW', currencyCode: 'EUR' },
      ]);
    });

    it('should return an empty array if only one currency is provided', () => {
      // Arrange
      const testList = ['USD'];

      // Act
      const act = exchangeRateService.generateCurrencyPairs(testList);

      // Assert
      expect(act).toEqual([]);
    });

    it('should return an empty array if no currencies are provided', () => {
      // Arrange
      const testList: string[] = [];

      // Act
      const act = exchangeRateService.generateCurrencyPairs(testList);

      // Assert
      expect(act).toEqual([]);
    });
  });
});
