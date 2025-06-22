import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CurrentExchangeRateReqDto,
  CurrentExchangeRateResDto,
  RateDetail,
} from '../dto/exchange-rates.dto';
import { ExchangeRateDailyRepository } from '../repositories/exchange-rate-daily.repository';
import { CurrentExchangeHistoryReqDto } from '../dto/exchange-rates-history.dto';
import { supportCurrencyList } from '../constants/support-currency.constant';
import {
  IFluctuationExchangeRateApi,
  ILatestExchangeRateApi,
} from '../../../infrastructure/externals/exchange-rates/interfaces/exchange-rate-rest-api.interface';
import { DateUtilService } from '../../../common/utils/date-util/date-util.service';
import { ExchangeRateRawRepository } from '../repositories/exchange-rate-raw.repository';
import { IExchangeRateDaily } from '../interfaces/exchange-rate-daily.interface';
import { getCurrencyNameInKorean } from '../constants/symbol-kr.mapper';
import { ExchangeRateRedisService } from './exchange-rate-redis.service';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';
import { CURRENCY_THRESHOLDS } from '../constants/currency-thresholds.constant';

@Injectable()
export class ExchangeRateService {
  private readonly supportCurrencyList = supportCurrencyList;
  private readonly latestRatethreshold = 10000; // 임계값 10s

  constructor(
    @Inject('LATEST_EXCHANGE_RATE_API')
    private readonly latestExchangeRateAPI: ILatestExchangeRateApi,
    @Inject('FLUCTUATION_RATE_API')
    private readonly fluctuationApi: IFluctuationExchangeRateApi,
    private readonly exchangeRateDailyRepository: ExchangeRateDailyRepository,
    private readonly dateUtilService: DateUtilService,
    private readonly exchangeRateRawRepository: ExchangeRateRawRepository,
    private readonly exchangeRateRedisService: ExchangeRateRedisService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.context = ExchangeRateService.name;
  }

  /**
   * 현재 최신 환율 조회 (기준 통화: KRW 고정)
   *
   * - Redis 최신 캐시 확인 → 시장 오픈 여부에 따라 다르게 처리
   * - 캐시 HIT: Redis 캐시로 응답
   *    - 시장 열림: 캐시 환율 + 변동률 포함
   *    - 시장 닫힘: 캐시 환율 + 변동률 0 처리
   * - 캐시 MISS:
   *    - 시장 열림: 외부 API(latest + fluctuation) 호출
   *    - 시장 닫힘: 마지막 마켓 오픈일 기준 Snapshot 조회
   * - 모든 fallback 실패 시 500 에러 반환
   */
  async getCurrencyExchangeRates(
    input: CurrentExchangeRateReqDto,
  ): Promise<CurrentExchangeRateResDto> {
    const targetCodes = input.currencyCodes?.length
      ? input.currencyCodes
      : this.supportCurrencyList.filter((code) => code !== input.baseCurrency);

    const preparedResponse: Record<
      string,
      Pick<RateDetail, 'rate' | 'dayChange' | 'dayChangePercent' | 'timestamp'>
    > = {};

    const isMarketOpen = this.dateUtilService.isMarketOpen();
    const isAliveLatestRateCache =
      await this.exchangeRateRedisService.getLatestRateHealthCheck('KRW');
    const isCacheHit =
      isAliveLatestRateCache &&
      isAliveLatestRateCache.getTime() > Date.now() - this.latestRatethreshold;

    // ==========================================
    // [1] 캐시 HIT
    // ==========================================
    if (isCacheHit) {
      await Promise.all(
        targetCodes.map(async (code) => {
          const [change, changePct, rate, timestamp] =
            await this.exchangeRateRedisService.getLatestRate('KRW', code);

          preparedResponse[code] = {
            rate: Number(rate),
            dayChange: isMarketOpen ? Number(change) : 0,
            dayChangePercent: isMarketOpen ? Number(changePct) : 0,
            timestamp: new Date(Number(timestamp)),
          };
        }),
      );

      this.logger.verbose(
        `cache hit! [redis only]${isMarketOpen ? '' : ' (주말은 변동량 없음'}`,
      );
      return {
        baseCurrency: input.baseCurrency,
        rates: this.combineLatestRates(input.baseCurrency, preparedResponse),
      };
    }

    // ==========================================
    // [2] 캐시 MISS
    // ==========================================
    if (!isCacheHit) {
      // [2-1] 시장 열림 → 외부 API fallback
      if (isMarketOpen) {
        this.logger.verbose(
          'cache missed! [external latest + fluctuation API]',
        );
        const [latestRateResponse, fluctuationResponse] = await Promise.all([
          this.latestExchangeRateAPI.getLatestRates(input.baseCurrency),
          this.fluctuationApi.getFluctuationData(
            this.dateUtilService.getLastMarketDay(),
            new Date(),
            input.baseCurrency,
            targetCodes,
          ),
        ]);

        targetCodes.forEach((code) => {
          preparedResponse[code] = {
            rate: latestRateResponse.rates[code],
            dayChange: fluctuationResponse.rates[code].change,
            dayChangePercent: fluctuationResponse.rates[code].changePct,
            timestamp: latestRateResponse.date,
          };
        });

        return {
          baseCurrency: input.baseCurrency,
          rates: this.combineLatestRates(input.baseCurrency, preparedResponse),
        };
      }

      // [2-2] 시장 닫힘 → 주말 fallback: Snapshot 조회
      if (!isMarketOpen) {
        const lastMarketDay = this.dateUtilService.getLastMarketDay();
        let snapshotRecords = await Promise.all(
          this.supportCurrencyList.map(async (code) => {
            return await this.exchangeRateDailyRepository.findDailyRates({
              baseCurrency: input.baseCurrency,
              currencyCode: code,
              startedAt: lastMarketDay,
              endedAt: lastMarketDay,
            });
          }),
        ).then((r) =>
          r.flat().filter((e) => e?.currencyCode !== input.baseCurrency),
        );

        if (snapshotRecords.length !== this.supportCurrencyList.length - 1) {
          this.logger.error(
            `폴백 스냅샷 없음, ${lastMarketDay} 기준 스냅샷 생성 시도`,
          );
          const yesterdayFromLastMarketDay =
            this.dateUtilService.getYesterday(lastMarketDay);
          await this.calculateDailyRates(
            yesterdayFromLastMarketDay,
            lastMarketDay,
          );

          snapshotRecords = await Promise.all(
            this.supportCurrencyList.map(async (code) => {
              return await this.exchangeRateDailyRepository.findDailyRates({
                baseCurrency: input.baseCurrency,
                currencyCode: code,
                startedAt: lastMarketDay,
                endedAt: lastMarketDay,
              });
            }),
          ).then((r) => r.flat());
        }

        snapshotRecords
          .filter((record) => targetCodes.includes(record.currencyCode))
          .forEach((record) => {
            preparedResponse[record.currencyCode] = {
              rate: Number(record.closeRate),
              dayChange: 0,
              dayChangePercent: 0,
              timestamp: record.ohlcDate,
            };
          });

        this.logger.verbose('weekend fallback! [snapshot]');
        return {
          baseCurrency: input.baseCurrency,
          rates: this.combineLatestRates(input.baseCurrency, preparedResponse),
        };
      }
    }

    // ==========================================
    // [3] 캐시, 스냅샷, 시장마감 셋다 존재하지 않을경우 500에러를 반환한다
    // ==========================================
    this.logger.error(
      'unexpected fallback error (no cache, no snapshot, no market open)',
    );
    throw new InternalServerErrorException('환율 데이터를 가져올 수 없습니다.');
  }

  /**
   * Generate daily data by combining recent currency-rate and fluctuation rate
   */
  private combineLatestRates(
    baseCurrency: string,
    rates: Record<
      string,
      Pick<RateDetail, 'rate' | 'dayChange' | 'dayChangePercent' | 'timestamp'>
    >,
  ): Record<string, RateDetail> {
    return Object.keys(rates).reduce<Record<string, RateDetail>>(
      (acc, currency) => {
        const data = rates[currency];

        if (currency === baseCurrency) {
          acc[currency] = {
            name: getCurrencyNameInKorean(currency),
            rate: 1,
            inverseRate: 1,
            dayChange: 0,
            dayChangePercent: 0,
            timestamp: data.timestamp,
          };

          return acc;
        }

        acc[currency] = {
          name: getCurrencyNameInKorean(currency),
          rate: data.rate,
          dayChange: data.dayChange,
          dayChangePercent: data.dayChangePercent,
          inverseRate: parseFloat((1 / data.rate).toFixed(6)),
          timestamp: data.timestamp,
        };
        return acc;
      },
      {},
    );
  }

  /**
   *  Historical data strategy
   *  1. Selecting historical data from DB
   *    - select data from exchange_rate_daily table
   *    - search data using index by (baseCurrency, currencyCode, ohlcDate)
   *    - if the data exists, response directly
   *
   *  2. Calculating missing data
   *    - compare the selected date from DB with the requested date
   *    - if there is missing data, call external API
   *    - save the data collcted at this context to the DB
   *    - response data just put in to the client
   */
  async getHistoricalRates(input: CurrentExchangeHistoryReqDto) {
    const historicalData =
      await this.exchangeRateDailyRepository.findDailyRates(input);

    const existingDates = historicalData.map((date) => date.ohlcDate);
    const missingDates = this.dateUtilService
      .getDatesBetween(input.startedAt, input.endedAt)
      .filter(
        (date) =>
          !existingDates.some(
            (existingDate) => existingDate.getTime() === date.getTime(),
          ),
      );

    // if DB has complete data, return directly
    if (!missingDates.length) return historicalData;
    // call external API
    const startDate = missingDates[0];
    const endDate = missingDates[missingDates.length - 1];

    const apiResponse = await this.fluctuationApi.getFluctuationData(
      startDate,
      endDate,
      input.baseCurrency,
      [input.currencyCode],
    );

    const dailyRecord: IExchangeRateDaily.ICreate[] = missingDates.map(
      (date) => {
        const fluctuations = apiResponse.rates[input.currencyCode];

        return {
          baseCurrency: input.baseCurrency,
          currencyCode: input.currencyCode,
          ohlcDate: date,
          openRate: fluctuations.startRate,
          highRate: fluctuations.highRate,
          lowRate: fluctuations.lowRate,
          closeRate: fluctuations.endRate,
          avgRate: (fluctuations.startRate + fluctuations.endRate) / 2,
          rateCount: 1,
        };
      },
    );
    await this.exchangeRateDailyRepository.saveDailyRates(dailyRecord);

    return await this.exchangeRateDailyRepository.findDailyRates(input);
  }

  /**
   * OHLC data aggregate on a specific date
   *
   * - find previous day's data from exchange_rates
   * - generate OHLC data and insert into exchange_rates_daily
   */
  async calculateDailyRates(startDate: Date, endDate: Date) {
    const fluctuationApiResponse = await this.fluctuationApi.getFluctuationData(
      startDate,
      endDate,
      'KRW',
      this.supportCurrencyList,
    );

    const ohlcRecord = Object.entries(fluctuationApiResponse.rates).map(
      ([currencyCode, data]): IExchangeRateDaily.ICreate => ({
        baseCurrency: 'KRW',
        currencyCode,
        ohlcDate: endDate,
        openRate: data.startRate,
        highRate: data.highRate,
        lowRate: data.lowRate,
        closeRate: data.endRate,
        avgRate: (data.startRate + data.endRate) / 2,
        rateCount: 1, // 요거는 없애도 될것같다.
      }),
    );

    await this.exchangeRateDailyRepository.saveDailyRates(ohlcRecord);
  }

  generateCurrencyPairs(
    currencyList: string[] = this.supportCurrencyList,
  ): { baseCurrency: string; currencyCode: string }[] {
    return currencyList.flatMap((baseCurrency) =>
      currencyList
        .filter((targetCurrency) => baseCurrency !== targetCurrency)
        .map((currencyCode) => ({ baseCurrency, currencyCode })),
    );
  }

  /**
   * WebSocket 연결 시 모든 통화 데이터 초기화
   * Redis에 없는 통화들을 한번에 Fluctuation API로 가져와서 초기 설정
   */
  async initializeAllCurrencyData(): Promise<void> {
    this.logger.info('Initializing all currency data from external API');

    try {
      // KRW를 제외한 모든 지원 통화 리스트
      const targetCurrencies = this.supportCurrencyList.filter(
        (code) => code !== 'KRW',
      );

      // Redis에서 기존 통화 데이터 존재 여부 체크
      const missingCurrencies =
        await this.checkMissingCurrencies(targetCurrencies);

      if (missingCurrencies.length > 0) {
        this.logger.info(
          `Fetching initial data for ${missingCurrencies.length} currencies: ${missingCurrencies.join(', ')}`,
        );
        await this.fetchAllMissingCurrencies(missingCurrencies);
      } else {
        this.logger.info('All currency data already exists in Redis');
      }

      this.logger.info('Currency data initialization completed');
    } catch (error) {
      this.logger.error('Failed to initialize currency data:', error);
      throw error;
    }
  }

  /**
   * Redis에 데이터가 없는 통화들을 체크
   */
  private async checkMissingCurrencies(
    targetCurrencies: string[],
  ): Promise<string[]> {
    const missingCurrencies: string[] = [];

    for (const currencyCode of targetCurrencies) {
      const [storedRate, storedTimestamp, storedOpenRate] =
        await this.exchangeRateRedisService.getLatestRate('KRW', currencyCode, {
          rate: true,
          timestamp: true,
          openRate: true,
        });

      if (!storedRate || !storedTimestamp || !storedOpenRate) {
        missingCurrencies.push(currencyCode);
      }
    }

    return missingCurrencies;
  }

  /**
   * 누락된 모든 통화 데이터를 fluctuation API로 한번에 가져오기
   */
  private async fetchAllMissingCurrencies(
    missingCurrencies: string[],
  ): Promise<void> {
    try {
      const lastMarketDay = this.dateUtilService.getLastMarketDay();
      const currentDate = new Date();

      // 모든 누락된 통화들의 fluctuation 데이터 가져옴
      this.logger.debug(
        `Calling fluctuation API for ${missingCurrencies.length} currencies`,
      );

      const fluctuationData = await this.fluctuationApi.getFluctuationData(
        lastMarketDay,
        currentDate,
        'KRW',
        missingCurrencies,
      );

      // Redis에 모든 데이터 저장
      const timestamp = Date.now();
      for (const currencyCode of missingCurrencies) {
        const rateData = fluctuationData.rates[currencyCode];
        if (rateData) {
          await this.exchangeRateRedisService.setLatestRate(
            'KRW',
            currencyCode,
            {
              rate: rateData.endRate,
              change: rateData.change,
              changePct: rateData.changePct,
              openRate: rateData.startRate,
              timestamp: timestamp,
            },
          );
        }
      }

      this.logger.info(
        `Successfully initialized ${missingCurrencies.length} currencies in redis`,
      );
    } catch (error) {
      this.logger.error('Failed to fetch missing currency data:', error);
      throw error;
    }
  }

  /**
   * 이 메서드는 시장 열림 여부를 신경 X,
   * 소켓 데이터 수신을 전제하여 항상 호출
   *
   * 1. Redis에 기존 저장된 환율 데이터(storedRate)가 없으면 스킵
   * 2. Redis에 데이터가 존재하는 경우
   *    - 기존 수집 시점(storedTimestamp)과 최신 수신 시점(latestTimestamp) 비교
   *    - 날짜가 바뀐 경우 변동률 초기화 (change=0, changePct=0)
   *    - 날짜가 같으면 변동률 계산
   *      - 각 통화쌍 변동률 기준 초과 시 full update + Pub/Sub 발행
   *      - 변동률 기준 이하이면 timestamp만 갱신
   * 3. 모든 경우에 대해 Raw 수집 기록은 항상 삽입
   */
  async handleLatestRateUpdate(
    baseCurrency: string,
    currencyCode: string,
    latestRate: number,
    latestTimestamp: number,
  ): Promise<void> {
    const latestRateRounded = parseFloat(latestRate.toFixed(6));

    // 1. 기존 데이터 조회
    const [storedLatestRateStr, storedTimestampStr, storedOpenRateStr] =
      await this.exchangeRateRedisService.getLatestRate('KRW', currencyCode, {
        rate: true,
        timestamp: true,
        openRate: true,
      });

    // 1. Redis에 저장된 데이터가 없는 경우 (레디스 장애 시) 500에러,
    if (!storedLatestRateStr || !storedTimestampStr || !storedOpenRateStr) {
      this.logger.warn(`No Redis data for ${currencyCode}`);
      return;
    }

    // 2. 새로운 거래일일 경우, 제일 마지막에 수집된 데이터를 넣어준 후, 변동률을 0으로 초기화
    const isNewTradingDay = this.dateUtilService.isNewTradingDay(
      latestTimestamp,
      parseInt(storedTimestampStr!),
    );
    if (isNewTradingDay) {
      const startRate = Number(storedLatestRateStr);
      this.exchangeRateRedisService.setLatestRate('KRW', currencyCode, {
        rate: latestRateRounded,
        timestamp: latestTimestamp,
        change: latestRateRounded - startRate,
        changePct: 0,
        openRate: startRate,
      });

      // health check 업데이트
      await this.exchangeRateRedisService.updateHealthCheck(baseCurrency);

      return;
    }

    // 3. 시가 대비 변동률 계산
    const openRate = parseFloat(storedOpenRateStr); // 저장된 해당 날짜의 시가
    const change = latestRateRounded - openRate;
    const changePct = (change / openRate) * 100;

    const thresholdsConfig =
      CURRENCY_THRESHOLDS[currencyCode] ?? CURRENCY_THRESHOLDS['DEFAULT'];

    const minAbsFluctuation = thresholdsConfig.minAbs;
    const pctBasedThreshold = Math.abs(openRate * (thresholdsConfig.pct / 100));
    const finalThreshold = Math.max(minAbsFluctuation, pctBasedThreshold);

    // 4. 변동률이 임계값 이상이면 전체 업데이트
    if (Math.abs(change) > finalThreshold) {
      await this.exchangeRateRedisService.updateLatestRate(
        'KRW',
        currencyCode,
        {
          rate: latestRateRounded,
          change,
          changePct,
          timestamp: latestTimestamp,
        },
      );

      // redis publish
      await this.exchangeRateRedisService.publishRateUpdate(
        baseCurrency,
        currencyCode,
        {
          baseCurrency,
          currencyCode,
          rate: latestRateRounded,
          change,
          changePct,
          timestamp: latestTimestamp,
          openRate,
        },
      );
    } else {
      // 5. 변동률 미미하면 timestamp만 업데이트
      await this.exchangeRateRedisService.updateLatestRate(
        baseCurrency,
        currencyCode,
        { timestamp: latestTimestamp },
      );

      this.logger.debug(
        `변화량이 작아 timestamp만 업데이트 [${baseCurrency}/${currencyCode}]`,
      );
    }

    // 6. Raw 데이터는 항상 저장 -> 시계열DB 고려?
    await this.exchangeRateRawRepository.createExchangeRate({
      baseCurrency,
      currencyCode,
      rate: latestRateRounded,
    });
  }
}
