import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
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

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly supportCurrencyList = supportCurrencyList;
  private readonly latestRatethreshold = 10000; // 임계값 10s

  constructor(
    @Inject('LATEST_EXCHANGE_RATE_API')
    private readonly latestExchangeRateAPI: ILatestExchangeRateApi,
    @Inject('FLUCTUATION_RATE_API')
    private readonly fluctuationRateAPI: IFluctuationExchangeRateApi,
    private readonly exchangeRateDailyRepository: ExchangeRateDailyRepository,
    private readonly dateUtilService: DateUtilService,
    private readonly exchangeRateRawRepository: ExchangeRateRawRepository,
    private readonly exchangeRateRedisService: ExchangeRateRedisService,
  ) {}

  /**
   * 현재 환율을 조회 (30개 통화쌍 반환)
   * - 기준 통화(baseCurrency)를 기준으로 환율을 조회함
   * - Redis에 저장된 latestRate 캐시 여부, FX 시장 상태(마켓 오픈/마감)에 따라 분기 처리
   * - 필요 시 외부 API를 호출해 응답 생성
   *
   * 캐시가 유효할 경우(신선한 데이터, Gateway가 정상적으로 환율을 처리하고있음을 확인)
   *  1. baseCurrency가 'KRW'일 경우
   *    - 1-1. 마켓이 열려있을 경우
   *      - 캐시(latestRate) + 외부API(fluctuation) 호출하여 응답을 조합하여 반환
   *    - 1-2. 마켓이 닫혀있을 경우 (주말)
   *      - 캐시(latestRate) + 변동률 0으로 처리하고 응답을 조합하여 반환
   *
   *  2. baseCurrency가 'KRW'가 아닌 경우 (캐시된 데이터를 기반으로 역산 처리 필요)
   *    - 2-1. 마켓이 열려있을 경우
   *      - Redis로부터 KRW/base, KRW/targetCodes를 불러와서 역산
   *      - 변동률은 외부API(fluctuation)를 호출하고, 변동률을 역산
   *      - 위 역산된 데이터들을 기반으로 응답을 조합하여 반환
   *    - 2-2. 마켓이 닫혀있을 경우 (주말)
   *      - Redis로부터 KRW/base, KRw/targetCodes 불러와서 역산
   *      - 변동률 데이터는 0으로 계산
   *      - 위 역산된 데이터들을 기반으로 응답을 조합하여 반환
   *
   * 캐시가 유효하지 않을 경우
   *  1. 마켓이 열려있을 경우
   *    - 외부 API 2개 호출 (latest - fluctuation) 호출하여 응답을 조합하여 반환
   *  2-2. 마켓이 닫혀있을 경우(주말)
   *    - fallback 대상 없음 -> redis도 캐시 안돼있고, 외부 API도 무용지물
   *    - 시장 마감 직전에 fallback snapshot 스케쥴러 필요
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

    // case 1: 캐시 HIT + base = KRW
    if (isCacheHitted && input.baseCurrency === 'KRW') {
      if (isMarketOpen) {
        const fluctuationResponse =
          await this.fluctuationRateAPI.getFluctuationData(
            this.dateUtilService.getYesterday(),
            new Date(),
            'KRW',
            targetCodes,
          );

        await Promise.all(
          targetCodes.map(async (code) => {
            const [, , rate, timestamp] =
              await this.exchangeRateRedisService.getLatestRate('KRW', code);

            preparedResponse[code] = {
              rate: Number(rate),
              dayChange: fluctuationResponse.rates[code].change,
              dayChangePercent: fluctuationResponse.rates[code].changePct,
              timestamp: new Date(Number(timestamp)),
            };
          }),
        );
      } else {
        await Promise.all(
          targetCodes.map(async (code) => {
            const [, , rate, timestamp] =
              await this.exchangeRateRedisService.getLatestRate('KRW', code);

            preparedResponse[code] = {
              rate: Number(rate),
              dayChange: 0,
              dayChangePercent: 0,
              timestamp: new Date(Number(timestamp)),
            };
          }),
        );
      }

      return {
        baseCurrency: 'KRW',
        rates: this.combinateLatestRates(preparedResponse),
      };
    }

    // case 2: 캐시 HIT + base ≠ KRW (역산 필요)

    if (isCacheHitted && input.baseCurrency !== 'KRW') {
      const [, , baseRateStr] =
        await this.exchangeRateRedisService.getLatestRate(
          'KRW',
          input.baseCurrency,
        );
      const baseRate = Number(baseRateStr);

      const baseRedisResult = await Promise.all(
        targetCodes.map(async (code) => {
          const [, , rate, timestamp] =
            await this.exchangeRateRedisService.getLatestRate('KRW', code);
          return {
            code,
            rate: Number(rate),
            timestamp: new Date(Number(timestamp)),
          };
        }),
      );

      if (isMarketOpen) {
        const fluctuationResponse =
          await this.fluctuationRateAPI.getFluctuationData(
            this.dateUtilService.getYesterday(),
            new Date(),
            'KRW',
            [...targetCodes, input.baseCurrency],
          );

        const baseFluctuation = fluctuationResponse.rates[input.baseCurrency];

        baseRedisResult.forEach((item) => {
          const invertedRate = item.rate / baseRate;
          const targetFluctuation = fluctuationResponse.rates[item.code];

          const changePct =
            targetFluctuation?.changePct - baseFluctuation.changePct;
          const change = invertedRate * (changePct / 100);

          preparedResponse[item.code] = {
            rate: invertedRate,
            dayChange: change,
            dayChangePercent: changePct,
            timestamp: item.timestamp,
          };
        });
      } else {
        baseRedisResult.forEach((item) => {
          const invertedRate = item.rate / baseRate;
          preparedResponse[item.code] = {
            rate: invertedRate,
            dayChange: 0,
            dayChangePercent: 0,
            timestamp: item.timestamp,
          };
        });
      }

      return {
        baseCurrency: input.baseCurrency,
        rates: this.combinateLatestRates(preparedResponse),
      };
    }

    // case 3: 캐시 MISS + 시장 열림 (call the external API (fallback))
    if (!isCacheHitted && isMarketOpen) {
      this.logger.debug('cache missed!!');

      const [latestRateResponse, fluctuationResponse] = await Promise.all([
        this.latestExchangeRateAPI.getLatestRates(input.baseCurrency),
        this.fluctuationRateAPI.getFluctuationData(
          this.dateUtilService.getYesterday(),
          new Date(),
          input.baseCurrency,
          targetCodes,
        ),
      ]);

      await Promise.all(
        targetCodes.map(async (code) => {
          preparedResponse[code] = {
            rate: latestRateResponse.rates[code],
            dayChange: fluctuationResponse.rates[code].change,
            dayChangePercent: fluctuationResponse.rates[code].changePct,
            timestamp: latestRateResponse.date,
          };
        }),
      );

      return {
        baseCurrency: input.baseCurrency,
        rates: this.combinateLatestRates(preparedResponse),
      };
    }

    // case 4: 캐시 MISS + 시장 닫힘 → fallback 불가
    // @todo fallback snapshot 복구 & 로깅
    throw new InternalServerErrorException('환율 데이터를 가져올 수 없습니다.');
  }

  /**
   * Gernerate daily data by combining recent currency-rate and fluctuation rate
   */
  private combinateLatestRates(
    rates: Record<
      string,
      Pick<RateDetail, 'rate' | 'dayChange' | 'dayChangePercent' | 'timestamp'>
    >,
  ): Record<string, RateDetail> {
    return Object.keys(rates).reduce<Record<string, RateDetail>>(
      (acc, currency) => {
        const data = rates[currency];

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

    const apiResponse = await this.fluctuationRateAPI.getFluctuationData(
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
    const ohlcRecords = (
      await Promise.all(
        supportCurrencyList.map(async (baseCurrency) => {
          const apiResponse = await this.fluctuationRateAPI.getFluctuationData(
            startDate,
            endDate,
            baseCurrency,
            this.supportCurrencyList.filter(
              (targetCode) => targetCode !== baseCurrency,
            ),
          );

          return Object.entries(apiResponse.rates).map(
            ([currencyCode, data]) => ({
              baseCurrency,
              currencyCode,
              ohlcDate: startDate,
              openRate: data.startRate,
              highRate: data.highRate,
              lowRate: data.lowRate,
              closeRate: data.endRate,
              avgRate: (data.startRate + data.endRate) / 2,
              rateCount: 1, // COINAPI에서 OHLC 데이터를 제공하므로 1로 고정
            }),
          );
        }),
      )
    ).flat();

    await this.exchangeRateDailyRepository.saveDailyRates(ohlcRecords);
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
   * 기본적으로 소켓에서 받은 데이터는 exchnage_rate_raw에 저장.
   *
   * 1. 날짜가 바뀌었는지 체크 (dateUtilService.isBefore)
   *  1-1. 날짜가 안바뀌었다면
   *  - 소켓으로 받은 rate와 가장 최신에 저장된 rate와 비교
   *  - 변동률이 일정 치 이상이다 -> latest-rates(redis) 업데이트
   *  - 변동률이 그대로다 -> skip
   *
   *  1-2. 날짜가 바뀌었다면
   *  - 해당 key의 가장 최신 데이터를 가져옴 (이전 날짜의 종가)
   *  - 해당 종가를 기준으로 change, chang_pct 초기화하고 latest-rates(redis) 업데이트.
   *
   * 2. exchange_rate_raw에 삽입
   */
  async processLatestRateFromWS(
    baseCurrency: string,
    currencyCode: string,
    latestRate: number,
    latestTimestamp: number,
  ): Promise<void> {
    // data from external api
    const latestRateRound = parseFloat(latestRate.toFixed(6));
    const latestDate = new Date(latestTimestamp);

    // redis에서 latest-rate의 hash(rate, timestamp) 조회
    const [storedRate, storedTimestamp] =
      await this.exchangeRateRedisService.getLatestRate(
        baseCurrency,
        currencyCode,
        {
          rate: true,
          timestamp: true,
        },
      );
    // 기존 데이터가 없을 시 초기 레코드 삽입 (redis-hash)
    if (!storedRate || !storedTimestamp) {
      await this.exchangeRateRedisService.setLatestRate(
        baseCurrency,
        currencyCode,
        {
          change: 0,
          changePct: 0,
          rate: latestRateRound,
          timestamp: latestTimestamp,
        },
      );
      this.logger.debug(
        `저장된 데이터가 존재하지 않아 새로운 통화쌍을 만들었습니다: ${baseCurrency}/${currencyCode}`,
      );
      return;
    }

    // data from redis (hashtable)
    const prevRate = parseFloat(storedRate);
    const prevRateRounded = parseFloat(prevRate.toFixed(6));
    const storedDate = new Date(storedTimestamp);
    const isNewDay = this.dateUtilService.isBefore(latestDate, storedDate);

    // 날짜가 바뀐 경우 변동률 0으로 초기화
    if (isNewDay) {
      await this.exchangeRateRedisService.setLatestRate(
        baseCurrency,
        currencyCode,
        {
          change: 0,
          changePct: 0,
          rate: latestRateRound,
          timestamp: latestTimestamp,
        },
      );
      this.logger.debug('날짜가 바뀌어서 변동률을 초기화했습니다');
    } else {
      // 같은 거래일인 경우, 변동률 계산
      const change = latestRateRound - prevRateRounded;
      const changePct = (change / prevRateRounded) * 100;
      const updateRecord = {
        change: change,
        changePct: changePct,
        rate: latestRateRound,
        timestamp: latestTimestamp,
      };

      // @TODO 변화감지량 상수화
      // 변동률이 일정치 이상이면
      if (Math.abs(changePct) > 0.01) {
        // 업데이트 (latest-rate (hash table))
        await this.exchangeRateRedisService.setLatestRate(
          baseCurrency,
          currencyCode,
          updateRecord,
        );
        // publish (rate-update)
        await this.exchangeRateRedisService.publishRateUpdate(
          baseCurrency,
          currencyCode,
          {
            ...updateRecord,
            baseCurrency: baseCurrency,
            currencyCode: currencyCode,
          },
        );

        this.logger.debug('');
        this.logger.debug('=============================================');
        this.logger.debug(`${prevRateRounded} ====>>>> ${latestRateRound}`);
        this.logger.debug(
          `변동량(${baseCurrency}/${currencyCode}): ${changePct}`,
        );
        this.logger.debug('=============================================');
        this.logger.debug('');
      } else {
        // 변동률이 일정하다면, timestamp만 부분 업데이트
        await this.exchangeRateRedisService.updateLatestRate(
          baseCurrency,
          currencyCode,
          {
            timestamp: latestTimestamp,
          },
        );
        this.logger.debug(
          `변동률이 일정해서(${baseCurrency}/${currencyCode}) timestmp만 업데이트쳤습니다`,
        );
      }
    }

    // 헬스체크 업데이트
    await this.exchangeRateRedisService.updateHealthCheck(baseCurrency);
    // 레코드 삽입 (default-postgres)
    await this.exchangeRateRawRepository.createExchangeRate({
      baseCurrency: baseCurrency,
      currencyCode: currencyCode,
      rate: latestRateRound,
    });

    return;
  }
}
