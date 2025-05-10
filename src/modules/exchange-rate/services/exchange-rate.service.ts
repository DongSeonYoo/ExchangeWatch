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
    const isCacheHitted =
      isAliveLatestRateCache &&
      isAliveLatestRateCache.getTime() > Date.now() - this.latestRatethreshold;

    // ==========================================
    // [1] 캐시 HIT
    // ==========================================
    if (isCacheHitted) {
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
        rates: this.combinateLatestRates(input.baseCurrency, preparedResponse),
      };
    }

    // ==========================================
    // [2] 캐시 MISS
    // ==========================================
    if (!isCacheHitted) {
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
          rates: this.combinateLatestRates(
            input.baseCurrency,
            preparedResponse,
          ),
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

        snapshotRecords.forEach((record) => {
          preparedResponse[record.currencyCode] = {
            rate: Number(record.closeRate),
            dayChange: 0, // 주말은 변동률 없음
            dayChangePercent: 0,
            timestamp: record.ohlcDate,
          };
        });

        this.logger.verbose('weekend fallback! [snapshot]');
        return {
          baseCurrency: input.baseCurrency,
          rates: this.combinateLatestRates(
            input.baseCurrency,
            preparedResponse,
          ),
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
   * Gernerate daily data by combining recent currency-rate and fluctuation rate
   */
  private combinateLatestRates(
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

    // additional logging
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
   * 이 메서드는 시장 열림 여부를 신경 X,
   * 소켓 데이터 수신을 전제하여 항상 호출
   *
   * 1. Redis에 기존 저장된 환율 데이터(storedRate)가 없으면 최초 수집 처리
   *    - 마지막 시장 거래일 기준 fluctuation API 호출
   *    - 초기 change, changePct 계산하여 저장
   *
   * 2. Redis에 데이터가 존재하는 경우
   *    - 기존 수집 시점(storedTimestamp)과 최신 수신 시점(latestTimestamp) 비교
   *    - 날짜가 바뀐 경우 변동률 초기화 (change=0, changePct=0)
   *    - 날짜가 같으면 변동률 계산
   *      - 변동률 기준(0.01%) 초과 시 full update + Pub/Sub 발행
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
    const latestRateDate = new Date(latestTimestamp);

    const [storedRateStr, storedTimestampStr] =
      await this.exchangeRateRedisService.getLatestRate('KRW', currencyCode, {
        rate: true,
        timestamp: true,
      });

    // 1. Redis에 저장된 데이터가 없는 경우 (최초 수집 or Redis 장애 복구 이후)
    if (!storedRateStr || !storedTimestampStr) {
      const lastMarketDay = this.dateUtilService.getLastMarketDay();
      const { rates: fluctuationRates } =
        await this.fluctuationApi.getFluctuationData(
          lastMarketDay,
          latestRateDate,
          baseCurrency,
          [currencyCode],
        );

      const yesterdayChange = fluctuationRates[currencyCode]?.change ?? 0;
      const yesterdayChangePct = fluctuationRates[currencyCode]?.changePct ?? 0;

      await this.exchangeRateRedisService.setLatestRate('KRW', currencyCode, {
        rate: latestRateRounded,
        change: yesterdayChange,
        changePct: yesterdayChangePct,
        timestamp: latestTimestamp,
      });

      await this.exchangeRateRawRepository.createExchangeRate({
        baseCurrency,
        currencyCode,
        rate: latestRateRounded,
      });

      return;
    }

    const prevRate = parseFloat(storedRateStr);
    const prevTimestamp = new Date(storedTimestampStr);
    const isNewDay = this.dateUtilService.isBefore(
      latestRateDate,
      prevTimestamp,
    );

    // 2. 날짜가 바뀌었으면 변동률 초기화
    if (isNewDay) {
      await this.exchangeRateRedisService.setLatestRate('KRW', currencyCode, {
        rate: latestRateRounded,
        change: 0,
        changePct: 0,
        timestamp: Number(storedTimestampStr), // 시장 열리지 않았으면 이전 timestamp 유지
      });

      await this.exchangeRateRawRepository.createExchangeRate({
        baseCurrency,
        currencyCode,
        rate: latestRateRounded,
      });

      return;
    }

    // 3. 날짜가 같으면 변동률 계산
    const change = latestRateRounded - prevRate;
    const changePct = (change / prevRate) * 100;
    if (Math.abs(changePct) > 0.01) {
      // 4-1. 변동률 기준 초과 시 full update + publish
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
        },
      );
    } else {
      // 4-2. 변동률 미만이면 timestamp만 update
      await this.exchangeRateRedisService.updateLatestRate(
        baseCurrency,
        currencyCode,
        {
          timestamp: latestTimestamp,
        },
      );

      this.logger.verbose(
        `변화량이 작아 timestamp만 업데이트 [${baseCurrency}/${currencyCode}]`,
      );
    }

    // 5. 항상 raw 기록 저장
    await this.exchangeRateRawRepository.createExchangeRate({
      baseCurrency,
      currencyCode,
      rate: latestRateRounded,
    });
  }
}
