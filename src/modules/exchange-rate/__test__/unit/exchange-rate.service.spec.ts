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
import { CurrentExchangeHistoryReqDto } from '../../dto/exchange-rates-history.dto';
import { ExchangeRatesDailyEntity } from '../../entities/exchange-rate-daily.entity';
import { IExchangeRateDaily } from '../../interfaces/exchange-rate-daily.interface';
import { ExchangeRateFixture } from '../fixture/exchange-rate-fixture';
import { ExchangeRateRawRepository } from '../../repositories/exchange-rate-raw.repository';
import { ExchangeRateService } from '../../services/exchange-rate.service';
import { ExchangeRateRedisService } from '../../services/exchange-rate-redis.service';

describe('ExchangeRateService', () => {
  const currencyCodes = supportCurrencyList.filter((code) => code !== 'KRW');

  let exchangeRateService: ExchangeRateService;

  let latestExchangeRateApi: MockProxy<ILatestExchangeRateApi>;
  let currencyLayerFluctuationApi: MockProxy<IFluctuationExchangeRateApi>;
  let coinApiFluctuationApi: MockProxy<IFluctuationExchangeRateApi>;

  let exchangeRateRedisService: MockProxy<ExchangeRateRedisService>;
  let dateUtilService: MockProxy<DateUtilService>;

  let exchangeRateDailyRepository: MockProxy<ExchangeRateDailyRepository>;
  let exchangeRateRawRepository: MockProxy<ExchangeRateRawRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        {
          provide: 'LATEST_EXCHANGE_RATE_API',
          useValue: mock<ILatestExchangeRateApi>(),
        },
        {
          provide: 'CURRENCYLAYER_FLUCTUATION_RATE_API',
          useValue: mock<IFluctuationExchangeRateApi>(),
        },
        {
          provide: 'COINAPI_FLUCTUATION_RATE_API',
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

    latestExchangeRateApi = module.get('LATEST_EXCHANGE_RATE_API');
    currencyLayerFluctuationApi = module.get(
      'CURRENCYLAYER_FLUCTUATION_RATE_API',
    );
    coinApiFluctuationApi = module.get('COINAPI_FLUCTUATION_RATE_API');

    exchangeRateService = module.get(ExchangeRateService);
    exchangeRateDailyRepository = module.get(ExchangeRateDailyRepository);
    exchangeRateRawRepository = module.get(ExchangeRateRawRepository);
    exchangeRateRedisService = module.get(ExchangeRateRedisService);
    dateUtilService = module.get(DateUtilService);
  });

  it('should definded externalAPIService', () => {
    expect(latestExchangeRateApi).toBeDefined();
    expect(currencyLayerFluctuationApi).toBeDefined();
  });

  describe('getCurrencyExchangeRates', () => {
    let latestApiSpy: jest.SpyInstance;
    let currencyLayerApiSpy: jest.SpyInstance;
    let coinApiFluctuationSpy: jest.SpyInstance;

    const yesterday = new Date(Date.now() - 86400000);
    const baseCurrency = 'KRW';

    beforeEach(() => {
      // return yesterday
      dateUtilService.getYesterday.mockReturnValue(yesterday);
      // init external api spy
      latestApiSpy = jest.spyOn(latestExchangeRateApi, 'getLatestRates');
      currencyLayerApiSpy = jest.spyOn(
        currencyLayerFluctuationApi,
        'getFluctuationData',
      );
      coinApiFluctuationSpy = jest.spyOn(
        coinApiFluctuationApi,
        'getFluctuationData',
      );
    });

    describe('Redis캐시가 유효할때', () => {
      beforeEach(() => {
        exchangeRateRedisService.getLatestRateHealthCheck.mockResolvedValue(
          new Date(Date.now() - 5000), // 5초전 수집된 정상 환율 데이타
        );

        exchangeRateRedisService.getLatestRate.mockResolvedValue([
          '-15', // change
          '-1.5', // changepct,
          '1500', // rate
          (new Date().getTime() - 5000).toString(), // 5초전 수집된 데이타
        ]);
      });

      it('시장이 열려있는 경우, Redis 캐시에 수집된 최신환율데이터를 그대로 이용해서 응답을 반환한다', async () => {
        // Arrange
        dateUtilService.isMarketOpen.mockReturnValue(true);

        // Act
        const result = await exchangeRateService.getCurrencyExchangeRates({
          baseCurrency,
          currencyCodes,
        });

        // Assert
        expect(Object.keys(result.rates)).toHaveLength(30); // 지원통화쌍 - basecurency = 30개
        Object.values(result.rates).forEach((rate) => {
          expect(rate.dayChange).toBe(-15);
          expect(rate.dayChangePercent).toBe(-1.5);
          expect(rate.rate).toBe(1500);
          expect(rate.inverseRate).toBeCloseTo(1 / 1500); // 소수점 근사값 비교
        });
      });

      it('시장이 닫혀있는 경우, Redis 캐시에 수집된 최신환율데이터를 그대로 이용하되, 변동량(change, changePct)은 0으로 설정한다', async () => {
        // Arrange
        dateUtilService.isMarketOpen.mockReturnValue(false);

        // Act
        const result = await exchangeRateService.getCurrencyExchangeRates({
          baseCurrency,
          currencyCodes,
        });

        // Assert
        expect(Object.keys(result.rates)).toHaveLength(30); // 지원통화쌍 - basecurency = 30개
        Object.values(result.rates).forEach((rate) => {
          expect(rate.dayChange).toBe(0);
          expect(rate.dayChangePercent).toBe(0);
          expect(rate.rate).toBe(1500);
          expect(rate.inverseRate).toBeCloseTo(1 / 1500); // 소수점 근사값 비교
        });
      });

      it('외부 API는 호출하지 않는다', async () => {
        // Act
        await exchangeRateService.getCurrencyExchangeRates({
          baseCurrency,
          currencyCodes,
        });

        // Assert
        expect(latestApiSpy).not.toHaveBeenCalled();
        expect(currencyLayerApiSpy).not.toHaveBeenCalled();
      });
    });

    describe('Redis캐시가 유효하지 않을 경우', () => {
      beforeEach(() => {
        exchangeRateRedisService.getLatestRateHealthCheck.mockResolvedValue(
          new Date(Date.now() - 180000), // 3분전 수집된 비정상 환율 데이터
        );

        latestExchangeRateApi.getLatestRates.mockResolvedValue(
          ExchangeRateFixture.createDefaultLatestRates(baseCurrency),
        );
        coinApiFluctuationApi.getFluctuationData.mockResolvedValue(
          ExchangeRateFixture.createDefaultFluctuationRates(baseCurrency),
        );
      });

      it('시장이 열려있는 경우, 외부 api(latestRate, fluctuationRate)를 호출하여 응답을 반환한다', async () => {
        // Arrange
        dateUtilService.isMarketOpen.mockReturnValue(true);

        // Act
        const result = await exchangeRateService.getCurrencyExchangeRates({
          baseCurrency,
          currencyCodes,
        });

        // Assert
        expect(latestApiSpy).toHaveBeenCalled();
        expect(coinApiFluctuationSpy).toHaveBeenCalled();
        expect(Object.keys(result.rates)).toHaveLength(30);
      });

      it('시장이 닫혀있는 경우, 마지막으로 시장이 닫혔던 날짜의 snapshot을 조회한다', async () => {
        // Arrange
        dateUtilService.isMarketOpen.mockReturnValue(false);
        const fakeDate = new Date('2025-04-18T00:00:00.000Z');
        dateUtilService.getLastMarketDay.mockReturnValue(fakeDate);

        // snapshot 가짜 데이터
        exchangeRateDailyRepository.findDailyRates.mockImplementation(
          ({ currencyCode }) =>
            ({
              currencyCode: currencyCode,
              closeRate: 1500,
              ohlcDate: fakeDate,
            }) as any,
        );

        // Act
        const result = await exchangeRateService.getCurrencyExchangeRates({
          baseCurrency,
          currencyCodes,
        });

        // Assert
        expect(result.baseCurrency).toBe(baseCurrency);
        expect(Object.keys(result.rates)).toHaveLength(currencyCodes.length);

        Object.values(result.rates).forEach((rate) => {
          expect(rate.dayChange).toBe(0); // 주말 변동률 0
          expect(rate.dayChangePercent).toBe(0); // 주말 변동률 0
          expect(rate.rate).toBe(1500);
          expect(rate.timestamp).toEqual(fakeDate);
        });
      });

      it('시장이 닫혀있는 경우,만약 폴백 스냅샷이 DB에 존재하지 않는다면, 마지막으로 시장이 닫혔던 날짜의 snapshot을 외부 fluctuation(currencyCode)를 호출해 저장한다', async () => {
        // Arrange
        const fakeDate = new Date('2025-04-18T00:00:00.000Z');
        dateUtilService.isMarketOpen.mockReturnValue(false);
        dateUtilService.getLastMarketDay.mockReturnValue(fakeDate);
        exchangeRateDailyRepository.findDailyRates.mockResolvedValue([] as any);
        currencyLayerApiSpy.mockResolvedValue(
          ExchangeRateFixture.createDefaultFluctuationRates(baseCurrency),
        );
        const dailyRateSaveSpy = jest.spyOn(
          exchangeRateDailyRepository,
          'saveDailyRates',
        );

        // Act
        await exchangeRateService.getCurrencyExchangeRates({
          baseCurrency,
          currencyCodes,
        });

        expect(dailyRateSaveSpy).toHaveBeenCalled();
        expect(currencyLayerApiSpy).toHaveBeenCalled();
      });

      it.todo(
        '캐시가 존재하지 않고, 스냅샷도 존재하지 않고, 시장도 열지 않았다면 500에러를 던진다',
      );
    });
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
        currencyLayerFluctuationApi.getFluctuationData.mockResolvedValue(
          ExchangeRateFixture.createDefaultFluctuationRates(
            'EUR',
            new Date('2025-01-01'),
            new Date('2025-01-04'),
          ),
        );

        const fluctuationAPIspy = jest.spyOn(
          currencyLayerFluctuationApi,
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
        currencyLayerFluctuationApi.getFluctuationData.mockResolvedValue(
          ExchangeRateFixture.createDefaultFluctuationRates(
            'EUR',
            new Date('2025-01-01'),
            new Date('2025-01-04'),
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
          currencyLayerFluctuationApi,
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

  describe('handleLatestRateUpdate', () => {
    const baseCurrency = 'KRW';
    const currencyCode = 'USD';
    const latestRate = 1.23456;
    const latestTimestamp = Date.now();
    let setLatestRateSpy: jest.SpyInstance;
    let updateRateSpy: jest.SpyInstance;
    let coinApiFluctuationSpy: jest.SpyInstance;

    beforeEach(() => {
      setLatestRateSpy = jest.spyOn(exchangeRateRedisService, 'setLatestRate');
      updateRateSpy = jest.spyOn(exchangeRateRedisService, 'updateLatestRate');
      coinApiFluctuationSpy = jest.spyOn(
        coinApiFluctuationApi,
        'getFluctuationData',
      );
    });

    it('redis에 저장된 데이터가 없는 경우 fluctuation API(coinapi)를 통해서 보강한다', async () => {
      // Arrange
      exchangeRateRedisService.getLatestRate.mockResolvedValue([null, null]);
      coinApiFluctuationApi.getFluctuationData.mockResolvedValue(
        ExchangeRateFixture.createDefaultFluctuationRates(baseCurrency),
      );

      // Act
      await exchangeRateService.handleLatestRateUpdate(
        baseCurrency,
        currencyCode,
        latestRate,
        latestTimestamp,
      );

      // Assert
      expect(coinApiFluctuationSpy).toHaveBeenCalled();
      expect(setLatestRateSpy).toHaveBeenCalled();
    });

    it('날짜가 바뀌었으면 변동률을 0으로 초기화한다', async () => {
      // Arrange
      dateUtilService.isBefore.mockReturnValue(true);
      exchangeRateRedisService.getLatestRate.mockResolvedValue([
        '1.2345',
        `${latestTimestamp - 86400000}`,
      ]);

      // Act
      await exchangeRateService.handleLatestRateUpdate(
        baseCurrency,
        currencyCode,
        latestRate,
        latestTimestamp,
      );

      // Assert
      expect(setLatestRateSpy).toHaveBeenCalledWith(
        baseCurrency,
        currencyCode,
        expect.objectContaining({
          change: 0,
          changePct: 0,
          rate: latestRate,
        }),
      );
    });

    it('같은 날짜이고 변동률이 임계치 이상이면 full update한다', async () => {
      // Arrange
      dateUtilService.isBefore.mockReturnValue(false);
      exchangeRateRedisService.getLatestRate.mockResolvedValue([
        `${latestRate - 100}`, // 외환위기급변화
        `${latestTimestamp - 5000}`, // 5초전 정상수집데이터
      ]);

      // Act
      await exchangeRateService.handleLatestRateUpdate(
        baseCurrency,
        currencyCode,
        latestRate,
        latestTimestamp,
      );

      // Assert
      expect(updateRateSpy).toHaveBeenCalledWith(baseCurrency, currencyCode, {
        change: 100,
        changePct: -101.24999190000065,
        rate: latestRate,
        timestamp: latestTimestamp,
      });
    });

    it('같은 날짜이고, 변동률이 존재하지 않는다면 timestamp만 업데이트 한다', async () => {
      // Arrange
      dateUtilService.isBefore.mockReturnValue(false);
      exchangeRateRedisService.getLatestRate.mockResolvedValue([
        `${latestRate}`, // latetRate와 변화가 없을때
        `${latestTimestamp - 5000}`, // 5초전 정상수집데이터
      ]);

      // Act
      await exchangeRateService.handleLatestRateUpdate(
        baseCurrency,
        currencyCode,
        latestRate,
        latestTimestamp,
      );

      // Assert
      expect(updateRateSpy).toHaveBeenCalledWith(baseCurrency, currencyCode, {
        timestamp: latestTimestamp,
      });
    });

    it('모든 케이스에 대해서 raw데이터를 rdb에 삽입한다', async () => {
      // Arrange
      exchangeRateRedisService.getLatestRate.mockResolvedValue([
        `${latestRate}`,
        `${latestTimestamp}`,
      ]);
      const rawSpy = jest.spyOn(
        exchangeRateRawRepository,
        'createExchangeRate',
      );

      // Act
      await exchangeRateService.handleLatestRateUpdate(
        baseCurrency,
        currencyCode,
        latestRate,
        latestTimestamp,
      );

      // Assert
      expect(rawSpy).toHaveBeenCalled();
      expect(rawSpy).toHaveBeenCalledWith({
        baseCurrency,
        currencyCode,
        rate: latestRate,
      });
    });

    it.todo('최초 저장 시 fluctuation API 실패하면 예외를 던진다');

    it.todo('변동률이 미미할 때 로그가 찍히는지 검증한다 (verbose level)');
  });
});
