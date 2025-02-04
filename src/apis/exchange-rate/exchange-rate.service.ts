import { Inject, Injectable } from '@nestjs/common';
import { ExchangeRateRepository } from './repositores/exchange-rate.repository';
import { IExchangeRate } from './interface/exchange-rate.interface';
import { RedisService } from '../../redis/redis.service';
import {
  CurrentExchangeRateReqDto,
  RateDetail,
} from './dto/exchange-rates.dto';
import { ExchangeRateDailyRepository } from './repositores/exchange-rate-daily.repository';
import { CurrentExchangeHistoryReqDto } from './dto/exchange-rates-history.dto';
import { DateUtilService } from '../../utils/date-util/date-util.service';
import { ExchangeRatesDailyEntity } from './entitites/exchange-rate-daily.entity';
import { getCurrencyNameInKorean } from './mapper/symbol-kr.mapper';
import { IExchangeRateAPIService } from '../../externals/exchange-rates/interfaces/exchange-rate-api-service';

@Injectable()
export class ExchangeRateService {
  private readonly majorCurrencyLists = [
    'AUD',
    'BGN',
    'BRL',
    'CAD',
    'CHF',
    'CNY',
    'CZK',
    'DKK',
    'GBP',
    'HKD',
    'HUF',
    'IDR',
    'ILS',
    'INR',
    'ISK',
    'JPY',
    'KRW',
    'MXN',
    'MYR',
    'NOK',
    'NZD',
    'PHP',
    'PLN',
    'RON',
    'SEK',
    'SGD',
    'THB',
    'TRY',
    'USD',
    'ZAR',
    'EUR',
  ];

  constructor(
    @Inject('EXCHANGE_RATE_API')
    private readonly exchangeRateExternalAPI: IExchangeRateAPIService,
    private readonly redisService: RedisService,
    private readonly exchangeRateRepository: ExchangeRateRepository,
    private readonly exchangeRateDailyRepository: ExchangeRateDailyRepository,
    private readonly dateUtilService: DateUtilService,
  ) {}

  async getCurrencyExchangeRates(input: CurrentExchangeRateReqDto) {
    const currencyCodes = input.currencyCodes?.length
      ? input.currencyCodes
      : this.majorCurrencyLists;

    const today = new Date();
    const [latestRates, fluctuationRates] = await Promise.all([
      this.exchangeRateExternalAPI.getLatestRates(
        input.baseCurrency,
        currencyCodes,
      ),
      this.exchangeRateExternalAPI.getOHLCData(
        this.dateUtilService.getYesterday(today),
        today,
        input.baseCurrency,
        currencyCodes,
      ),
    ]);

    const targetCodes = input.currencyCodes?.length
      ? input.currencyCodes
      : Object.keys(latestRates.rates);

    const processedRates = targetCodes.reduce<Record<string, RateDetail>>(
      (acc, code) => {
        const rate = latestRates.rates[code];
        const fluctuation = fluctuationRates.rates[code];
        acc[code] = {
          name: getCurrencyNameInKorean(code),
          rate: rate,
          dayChange: fluctuation.change,
          dayChangePercent: fluctuation.changePct,
          high24h: Math.max(fluctuation.startRate, fluctuation.endRate),
          low24h: Math.min(fluctuation.startRate, fluctuation.endRate),
        };

        return acc;
      },
      {},
    );

    return {
      baseCurrency: latestRates.baseCurrency,
      rates: processedRates,
    };
  }

  /**
   * @TODO - redis caching strategy
   * Redis 키 구조:
   *  - 키: historical:{baseCurrency}:{currencyCode}:{date}
   *  - 값: OHLC 데이터
   *  - TTL: 24시간
   * redis 조회 순서:
   *  1. Redis 캐시 확인
   *  2. 캐시 미스시 DB 조회
   *  3. DB 조회 결과 캐싱
   * 로깅 철저하게
   *
   * Historical data strategy
   * 1. Selecting historical data from DB
   *  - select data from exchange_rate_daily table
   *  - search data using index by (baseCurrency, currencyCode, ohlcDate)
   *  - if the data exists, response directly
   *
   * 2. Calculating missing data
   *  - compare the selected date from DB with the requested date
   *  - if there is missing data, call external API(fixer)
   *  - save the data collcted at this context to the DB
   *  - response data just put in to the client
   */
  async getHistoricalRates(
    input: CurrentExchangeHistoryReqDto,
  ): Promise<ExchangeRatesDailyEntity[]> {
    const historicalDataFromDB =
      await this.exchangeRateDailyRepository.findDailyRates({
        baseCurrency: input.baseCurrency,
        currencyCode: input.currencyCode,
        endedAt: input.endedAt,
        startedAt: input.startedAt,
      });

    const requestedAllDate = this.dateUtilService.getDatesBeetween(
      input.startedAt,
      input.endedAt,
    );

    const existingDates = historicalDataFromDB.map((e) => e.ohlcDate);
    const missingDates = requestedAllDate.filter((reqDate) => {
      const strExistDates = existingDates.map((e) => e.toISOString());
      const strReqDates = reqDate.toISOString();

      return !strExistDates.includes(strReqDates);
    });

    if (missingDates.length > 0) {
      await Promise.all(
        missingDates.map(async (date) => {
          const fluctuationData =
            await this.exchangeRateExternalAPI.getOHLCData(
              this.dateUtilService.getYesterday(date),
              date,
              input.baseCurrency,
              [input.currencyCode],
            );
          const fluctuation = fluctuationData.rates[input.currencyCode];

          await this.exchangeRateDailyRepository.saveDailyRates({
            baseCurrency: input.baseCurrency,
            currencyCode: input.currencyCode,
            openRate: fluctuation.startRate,
            closeRate: fluctuation.endRate,
            highRate: Math.max(fluctuation.startRate, fluctuation.endRate),
            lowRate: Math.min(fluctuation.startRate, fluctuation.endRate),
            avgRate: (fluctuation.startRate + fluctuation.endRate) / 2,
            ohlcDate: date,
            rateCount: 1,
          });

          const missedOHLCdata =
            await this.exchangeRateDailyRepository.findDailyRates({
              baseCurrency: input.baseCurrency,
              currencyCode: input.currencyCode,
              startedAt: date,
              endedAt: date,
            });

          historicalDataFromDB.push(...missedOHLCdata);
        }),
      );
    }

    return historicalDataFromDB;
  }

  /**
   * OHLC data aggregate on a specific date
   */
  async aggregateDailyRates(startDate: Date, endDate: Date) {
    const fluctuationData = await this.exchangeRateExternalAPI.getOHLCData(
      startDate,
      endDate,
    );

    const dailyStats = await this.exchangeRateRepository.findDailyStats(
      startDate,
      endDate,
    );

    dailyStats.map(async (stats) => {
      const fluctuation = fluctuationData.rates[stats.currencyCode];
      await this.exchangeRateDailyRepository.saveDailyRates({
        baseCurrency: stats.baseCurrency,
        currencyCode: stats.currencyCode,
        openRate: fluctuation.startRate,
        closeRate: fluctuation.endRate,
        highRate: stats.maxRate,
        lowRate: stats.minRate,
        avgRate: stats.avgRate,
        rateCount: stats.count,
        ohlcDate: startDate,
      });
    });

    return;
  }

  /**
   * Performing tasks following caching strategies
   *
   * 1. get latest-rate from external API
   * 2. convert recived data to record for RDB
   * 3. update cache
   */
  async saveLatestRates(): Promise<void> {
    const rates = await this.exchangeRateExternalAPI.getLatestRates();

    this.majorCurrencyLists.map(async (majorBaseCurrency) => {
      const res: IExchangeRate.ICreate[] = Object.entries(rates.rates).map(
        ([currencyCode, rate]) => ({
          baseCurrency: majorBaseCurrency,
          currencyCode,
          rate,
        }),
      );

      // TODO: distribute transaction & analize excution time
      await Promise.all([
        this.exchangeRateRepository.saveLatestRates(res),
        this.redisService.updateLatestRateCache(res),
      ]);
    });
  }
}
