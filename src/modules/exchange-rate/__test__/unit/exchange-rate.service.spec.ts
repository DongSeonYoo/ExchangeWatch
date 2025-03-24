import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateDailyRepository } from '../../repositories/exchange-rate-daily.repository';
import { DateUtilService } from '../../../../common/utils/date-util/date-util.service';
import {
  IFluctuationExchangeRateApi,
  ILatestExchangeRateApi,
} from '../../../../infrastructure/externals/exchange-rates/interfaces/exchange-rate-rest-api.interface';
import { MockProxy, mock } from 'jest-mock-extended';
import { supportCurrencyList } from '../../constants/support-currency.constant';
import typia from 'typia';
import { CurrentExchangeRateResDto } from '../../dto/exchange-rates.dto';
import { CurrentExchangeHistoryReqDto } from '../../dto/exchange-rates-history.dto';
import { ExchangeRatesDailyEntity } from '../../entities/exchange-rate-daily.entity';
import { IExchangeRateDaily } from '../../interfaces/exchange-rate-daily.interface';
import { ExchangeRateFixture } from '../fixture/exchange-rate-fixture';
import { ExchangeRateRawRepository } from '../../repositories/exchange-rate-raw.repository';
import { ExchangeRateRedisService } from '../../../../infrastructure/redis/services/exchange-rate-redis.service';
import { ExchangeRateService } from '../../services/exchange-rate.service';

describe('ExchangeRateService', () => {
  let exchangeRateService: ExchangeRateService;

  let latestExchangeRateApi: MockProxy<ILatestExchangeRateApi>;
  let fluctuationExchangeRateApi: MockProxy<IFluctuationExchangeRateApi>;

  let exchangeRateDailyRepository: MockProxy<ExchangeRateDailyRepository>;
  let dateUtilService: MockProxy<DateUtilService>;
  let exchangeRateRawRepository: MockProxy<ExchangeRateRawRepository>;
  let exchangeRateRedisService: MockProxy<ExchangeRateRedisService>;

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
        {
          provide: ExchangeRateRawRepository,
          useValue: mock<ExchangeRateRawRepository>(),
        },
        {
          provide: ExchangeRateRedisService,
          useValue: mock<ExchangeRateRedisService>(),
        },
      ],
    }).compile();

    exchangeRateService = module.get(ExchangeRateService);

    latestExchangeRateApi = module.get('LATEST_EXCHANGE_RATE_API');
    fluctuationExchangeRateApi = module.get('FLUCTUATION_RATE_API');

    exchangeRateDailyRepository = module.get(ExchangeRateDailyRepository);
    exchangeRateRawRepository = module.get(ExchangeRateRawRepository);
    exchangeRateRedisService = module.get(ExchangeRateRedisService);
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

        dateUtilService.getDatesBetween.mockReturnValue(requestedDates);
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

        dateUtilService.getDatesBetween.mockReturnValue(requestedDates);

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

        dateUtilService.getDatesBetween.mockReturnValue(requestedDates);

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

  describe('processLatestRate', () => {
    // recived latest data from socket
    const baseCurrency = 'EUR';
    const currencyCode = 'KRW';
    const latestRate = 1580;
    const latestTimestamp = new Date().getTime();

    it('기본적으로는 소켓으로 받은 데이터를 모두 rdb에 삽입한다', async () => {
      // Arrange
      exchangeRateRedisService.getLatestRate.mockResolvedValue([] as any);

      // Act
      const createRateInRawSpy = jest.spyOn(
        exchangeRateRawRepository,
        'createExchangeRate',
      );
      await exchangeRateService.processLatestRateFromWS(
        baseCurrency,
        currencyCode,
        latestRate,
        latestTimestamp,
      );

      // Assert
      expect(createRateInRawSpy).toHaveBeenCalledWith({
        baseCurrency,
        currencyCode,
        rate: latestRate,
      });
    });

    describe('해당 통화쌍에 대한 hash데이터가 존재할 경우', () => {
      describe('날짜가 바뀌지 않은 경우 (같은 일(day)의 소켓 데이터인 경우)', () => {
        beforeEach(() => {
          dateUtilService.isBefore.mockReturnValue(false);
        });

        it('변동률이 일정 치 이상이라면 변동된 값으로 redis에 업데이트한다', async () => {
          // Arrange
          const lastStoredRateData = 1579;
          const lastStoredTimeStamp = latestTimestamp - 5000;

          exchangeRateRedisService.getLatestRate.mockResolvedValue([
            `${lastStoredRateData}`,
            `${lastStoredTimeStamp}`,
          ]);
          const setRateInRedisSpy = jest.spyOn(
            exchangeRateRedisService,
            'setLatestRate',
          );

          // Act
          await exchangeRateService.processLatestRateFromWS(
            baseCurrency,
            currencyCode,
            latestRate,
            latestTimestamp,
          );

          // Assert
          expect(setRateInRedisSpy).toHaveBeenCalledWith(
            baseCurrency,
            currencyCode,
            {
              change: expect.any(Number),
              changePct: expect.any(Number),
              rate: latestRate,
              timestamp: latestTimestamp,
            },
          );
        });

        it('변동률이 존재하지 않는다면 업데이트 하지 않는다', async () => {
          // Arrange
          const lastStoredRateData = 1580; // 이전 가격과 동일
          const lastStoredTimeStamp = latestTimestamp - 5000;

          exchangeRateRedisService.getLatestRate.mockResolvedValue([
            `${lastStoredRateData}`,
            `${lastStoredTimeStamp}`,
          ]);
          const setRateInRedisSpy = jest.spyOn(
            exchangeRateRedisService,
            'setLatestRate',
          );

          // Act
          await exchangeRateService.processLatestRateFromWS(
            baseCurrency,
            currencyCode,
            latestRate,
            latestTimestamp,
          );

          // Assert
          expect(setRateInRedisSpy).not.toHaveBeenCalled();
        });

        it('변동률이 아주 미비할 시 업데이트 하지 않는다', async () => {
          // Arrange
          const lastStoredRateData = 1579.99873; // 변동률 미비
          const lastStoredTimeStamp = latestTimestamp - 5000;

          exchangeRateRedisService.getLatestRate.mockResolvedValue([
            `${lastStoredRateData}`,
            `${lastStoredTimeStamp}`,
          ]);
          const setRateInRedisSpy = jest.spyOn(
            exchangeRateRedisService,
            'setLatestRate',
          );

          // Act
          await exchangeRateService.processLatestRateFromWS(
            baseCurrency,
            currencyCode,
            latestRate,
            latestTimestamp,
          );

          // Assert
          expect(setRateInRedisSpy).not.toHaveBeenCalled();
        });

        it.todo('로그 잘 찍히는지');
      });

      describe('날짜가 바뀐 경우 (다음 날짜(day)의 latestRate인 경우)', () => {
        beforeEach(() => {
          dateUtilService.isBefore.mockReturnValue(true);
        });

        it('변동률을 0으로 초기화하고, 이전 데이터를 그대로 업데이트한다', async () => {
          // Arrange
          const setRateInRedisSpy = jest.spyOn(
            exchangeRateRedisService,
            'setLatestRate',
          );
          const lastStoredRateData = 1580;
          const lastStoredTimeStamp = latestTimestamp - 5000;

          exchangeRateRedisService.getLatestRate.mockResolvedValue([
            `${lastStoredRateData}`,
            `${lastStoredTimeStamp}`,
          ]);

          // Act
          await exchangeRateService.processLatestRateFromWS(
            baseCurrency,
            currencyCode,
            latestRate,
            latestTimestamp,
          );

          // Assert
          expect(setRateInRedisSpy).toHaveBeenCalledWith(
            baseCurrency,
            currencyCode,
            {
              change: 0,
              changePct: 0,
              rate: lastStoredRateData,
              timestamp: latestTimestamp,
            },
          );
        });

        it.todo('로그 잘 찍히는지');
      });
    });

    describe('해당 통화쌍에 대한 hash데이터가 존재하지 않을 경우', () => {
      it('redis에 해당 통화쌍에 대한 초기 레코드(hash)를 삽입한다', async () => {
        // Arrange
        const lastStoredRateData = null;
        const lastStoredTimeStamp = null;

        exchangeRateRedisService.getLatestRate.mockResolvedValue([
          lastStoredRateData,
          lastStoredTimeStamp,
        ]);
        const setRateInRedisSpy = jest.spyOn(
          exchangeRateRedisService,
          'setLatestRate',
        );

        // Act
        await exchangeRateService.processLatestRateFromWS(
          baseCurrency,
          currencyCode,
          latestRate,
          latestTimestamp,
        );

        // Assert
        expect(setRateInRedisSpy).toHaveBeenCalledWith(
          baseCurrency,
          currencyCode,
          {
            change: 0,
            changePct: 0,
            rate: latestRate,
            timestamp: latestTimestamp,
          },
        );
      });
    });
  });
});
