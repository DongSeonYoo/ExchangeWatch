import { Inject, Injectable, Logger } from '@nestjs/common';
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
   * baseCurrency를 기준으로 최신 환율정보를 응답합니다 (30개의 통화쌍에 대해서)
   *
   * 1. baseCurrency가 KRW인경우
   *  - Redis에 저장되어있는 최신 latestRate 확인 (ExternalGateway로부터 정기적으로 수집된)
   *  - 해당 latestRate의 수집 시간이 임계치를 만족한다면 (캐시조건 부합)
   *    - 해당 데이터들을 이용해서 응답을 조합하고 반환
   *
   *  - 해당 latestRate의 수집 시간이 임계치를 만족하지 않는다면 (캐시조건 미부합)
   *    - 외부API 각각 호출(latest-rate, fluctuation-rate)
   *    - 해당 데이터들을 이용해서 응답을 조합하고 반환
   *
   * 2. baseCurrency가 KRW가 아닌 경우 (KRW 기준으로 환율 역산(캐싱))
   *  역산 로직:
   *  - Redis에 저장되어있는 KRW/{baseCurrency}에 대한 latestRate값을 가져옴
   *  - KRW/{targetCodes} 30개 조회
   *  - (KRW/{input.baseCurrency}) / (KRW/{targetCodes...})
   *
   *  - latest-lates는 외부 API 콜하지 않아도 됌
   *  - fluctuation정보들은 어쩔수 없이 외부 API 콜해야함 (연산 불가)
   *
   * 3. 위 캐시 조건들을 부합하지 못할 경우
   *  - SocketGateWay오류 혹은 외부 API 장애로 인해 latestRate 수집이 지연되었다고 판단
   *  - 외부 API로부터 latest-rate, fluctuation-rate 호출
   *  - 해당 데이터들을 이용해서 응답을 조합하고 반환
   *
   * @returns CurrentExchangeRateResDto
   */
  async getCurrencyExchangeRates(
    input: CurrentExchangeRateReqDto,
  ): Promise<CurrentExchangeRateResDto> {
    const targetCodes = input.currencyCodes?.length
      ? input.currencyCodes
      : this.supportCurrencyList;
    const today = new Date();
    // 응답 객체 준비
    const preparedResponse: Record<
      string,
      Pick<RateDetail, 'rate' | 'dayChange' | 'dayChangePercent' | 'timestamp'>
    > = {};

    if (input.baseCurrency === 'KRW') {
      const isAliveLatestRateCache =
        await this.exchangeRateRedisService.getLatestRateHealthCheck(
          input.baseCurrency,
        );
      const isCacheHitted =
        isAliveLatestRateCache &&
        isAliveLatestRateCache.getTime() >
          Date.now() - this.latestRatethreshold;

      if (isCacheHitted) {
        this.logger.debug('latest-rate cache hit!!');
        for (const code of targetCodes) {
          const [change, changePct, rate, timestamp] =
            await this.exchangeRateRedisService.getLatestRate(
              input.baseCurrency,
              code,
            );

          // 캐시 히트 시 무조건 4개 캐시데이터 보장
          preparedResponse[code] = {
            rate: Number(rate),
            dayChange: Number(change),
            dayChangePercent: Number(changePct),
            timestamp: new Date(Number(timestamp)),
          };
        }

        return {
          baseCurrency: input.baseCurrency,
          rates: this.combinateLatestRates(preparedResponse),
        };
      }
    }

    if (input.baseCurrency !== 'KRW') {
      const [_, __, baseRateStr] =
        await this.exchangeRateRedisService.getLatestRate(
          'KRW',
          input.baseCurrency,
        );

      // external API(fluctuation) + Redis rates 병렬 실행
      const [fluctuationResult, redisResults] = await Promise.all([
        // fetch fluctuation data from external API
        this.fluctuationRateAPI.getFluctuationData(
          this.dateUtilService.getYesterday(),
          today,
          'KRW',
          targetCodes,
        ),
        // 역산을 위해 필요한 latest-save-rate 데이터 조합
        await Promise.all(
          targetCodes.map(async (code) => {
            const [_, __, rate, timestamp] =
              await this.exchangeRateRedisService.getLatestRate('KRW', code);

            return {
              code,
              rate: Number(rate),
              timestamp: new Date(Number(timestamp)),
            };
          }),
        ),
      ]);

      // 역산 후 데이터 조합
      redisResults.map((item) => {
        const rate = item.rate / Number(baseRateStr);
        const code = item.code;

        preparedResponse[code] = {
          rate,
          dayChange: fluctuationResult.rates[code].change,
          dayChangePercent: fluctuationResult.rates[code].changePct,
          timestamp: item.timestamp,
        };
      });
      this.logger.log('basecurrency가 달라서 latestRate만 역산하였습니다');

      return {
        baseCurrency: input.baseCurrency,
        rates: this.combinateLatestRates(preparedResponse),
      };
    }

    this.logger.debug('cache missed!!');
    const [latestRates, fluctuationRates] = await Promise.all([
      this.latestExchangeRateAPI.getLatestRates(
        input.baseCurrency,
        targetCodes,
      ),
      this.fluctuationRateAPI.getFluctuationData(
        this.dateUtilService.getYesterday(today),
        today,
        input.baseCurrency,
        targetCodes,
      ),
    ]);
    targetCodes.forEach((code) => {
      preparedResponse[code] = {
        rate: latestRates.rates[code],
        dayChange: fluctuationRates.rates[code].change,
        dayChangePercent: fluctuationRates.rates[code].changePct,
        timestamp: new Date(),
      };
    });

    return {
      baseCurrency: latestRates.baseCurrency,
      rates: this.combinateLatestRates(preparedResponse),
    };
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
