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
import { IExchangeRateDaily } from '../../interface/exchange-rate-daily.interface';
import { ExchangeRatesEntity } from '../../entitites/exchange-rate.entity';

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
        exchangeRateExternalService.getFluctuationData.mockImplementation(
          async (
            startDate,
            endDate,
            baseCurrency: string,
            [currencyCode]: string[],
          ) => {
            return {
              baseCurrency,
              startDate,
              endDate,
              rates: {
                [currencyCode]: {
                  startRate: 1,
                  endRate: 1.1,
                  change: 0.1,
                  changePct: 1,
                },
              },
            };
          },
        );
        const externalAPISpy = jest.spyOn(
          exchangeRateExternalService,
          'getFluctuationData',
        );
        const dailyRepositorySpy = jest.spyOn(
          exchangeRateDailyRepository,
          'saveDailyRates',
        );

        // Act
        const act = await exchangeRateService.getHistoricalRates(input);

        // Assert
        expect(externalAPISpy).toHaveBeenCalledTimes(missingDates.length);
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
        exchangeRateExternalService.getFluctuationData.mockImplementation(
          async (
            startDate,
            endDate,
            baseCurrency: string,
            [currencyCode]: string[],
          ) => {
            return {
              baseCurrency,
              startDate,
              endDate,
              rates: {
                [currencyCode]: {
                  startRate: 1,
                  endRate: 1.1,
                  change: 0.1,
                  changePct: 1,
                },
              },
            };
          },
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
          exchangeRateExternalService,
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
    describe('should save daily rates into exchangeRateDaily from exchangeRate', () => {
      it('should save 930 rates when DB has complete data', async () => {
        // Arragne
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-02');

        exchangeRateRepository.findRatesByDate.mockResolvedValue([
          {
            rate: 1,
            createdAt: startDate,
          },
          {
            rate: 1,
            createdAt: endDate,
          },
        ] as ExchangeRatesEntity[]);

        const externalAPIspy = jest.spyOn(
          exchangeRateExternalService,
          'getFluctuationData',
        );
        const saveDailyRateSpy = jest.spyOn(
          exchangeRateDailyRepository,
          'saveDailyRates',
        );
        const generateOHLCSpy = jest.spyOn(
          exchangeRateService,
          'generateOHLCdata',
        );

        // Act
        const act = await exchangeRateService.calculateDailyRates(
          startDate,
          endDate,
        );

        // Assert
        expect(externalAPIspy).not.toHaveBeenCalled();
        expect(saveDailyRateSpy).toHaveBeenCalledWith(expect.any(Array));

        expect(generateOHLCSpy).toHaveBeenCalledTimes(930);
        expect(() => {
          typia.assert<IExchangeRateDaily.ICreate[]>(
            saveDailyRateSpy.mock.calls[0][0],
          );
        }).not.toThrow();
      });

      it('should call external API when db has no data', async () => {
        // Arrage
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-02');

        exchangeRateRepository.findRatesByDate.mockResolvedValue(
          [] as ExchangeRatesEntity[],
        );

        exchangeRateExternalService.getFluctuationData.mockImplementation(
          async (
            startDate,
            endDate,
            baseCurrency: string,
            [currencyCode]: string[],
          ) => {
            return {
              baseCurrency,
              startDate,
              endDate,
              rates: {
                [currencyCode]: {
                  startRate: 1,
                  endRate: 1.1,
                  change: 0.1,
                  changePct: 1,
                },
              },
            };
          },
        );

        const externalAPIspy = jest.spyOn(
          exchangeRateExternalService,
          'getFluctuationData',
        );
        const saveDailyRateSpy = jest.spyOn(
          exchangeRateDailyRepository,
          'saveDailyRates',
        );
        const generateOHLCSpy = jest.spyOn(
          exchangeRateService,
          'generateOHLCdata',
        );

        // Assert
        const act = await exchangeRateService.calculateDailyRates(
          startDate,
          endDate,
        );

        // Act
        expect(externalAPIspy).toHaveBeenCalledTimes(930);
        expect(generateOHLCSpy).toHaveBeenCalledTimes(930);
        expect(saveDailyRateSpy.mock.calls[0][0]).toHaveLength(930);
        expect(() =>
          typia.assert<IExchangeRateDaily.ICreate[]>(
            saveDailyRateSpy.mock.calls[0][0],
          ),
        ).not.toThrow();
      });

      it.todo('should call external API when DB data is below the threshold');
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

  describe('getExistingRates', () => {
    it('should return exchange rates from the DB for given currency pairs', async () => {
      // Arrange
      const testPairs = [
        { baseCurrency: 'USD', currencyCode: 'KRW' },
        { baseCurrency: 'EUR', currencyCode: 'USD' },
      ];
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-02');

      exchangeRateRepository.findRatesByDate
        .mockResolvedValueOnce([
          {
            baseCurrency: 'USD',
            currencyCode: 'KRW',
            rate: 1.2,
            createdAt: startDate,
          },
        ] as ExchangeRatesEntity[])
        .mockResolvedValueOnce([
          {
            baseCurrency: 'EUR',
            currencyCode: 'USD',
            rate: 1.1,
            createdAt: startDate,
          },
        ] as ExchangeRatesEntity[]);

      // Act
      const act = await exchangeRateService.getExistingRates(
        testPairs,
        startDate,
        endDate,
      );

      // Assert
      expect(act).toHaveLength(2);
      expect(act).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            baseCurrency: 'USD',
            currencyCode: 'KRW',
            rate: 1.2,
          }),
          expect.objectContaining({
            baseCurrency: 'EUR',
            currencyCode: 'USD',
            rate: 1.1,
          }),
        ]),
      );
    });
  });
});
