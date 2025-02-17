import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExchangeRateRepository } from './repositores/exchange-rate.repository';
import { IExchangeRate } from './interface/exchange-rate.interface';
import {
  CurrentExchangeRateReqDto,
  CurrentExchangeRateResDto,
  RateDetail,
} from './dto/exchange-rates.dto';
import { ExchangeRateDailyRepository } from './repositores/exchange-rate-daily.repository';
import { CurrentExchangeHistoryReqDto } from './dto/exchange-rates-history.dto';
import { DateUtilService } from '../../utils/date-util/date-util.service';
import { ExchangeRatesDailyEntity } from './entitites/exchange-rate-daily.entity';
import { getCurrencyNameInKorean } from './mapper/symbol-kr.mapper';
import { IExchangeRateAPIService } from '../../externals/exchange-rates/interfaces/exchange-rate-api-service';
import { ExchangeRateSubscribeDto } from './dto/exchange-rates-subscribe.dto';
import { IExchangeRateExternalAPI } from '../../externals/exchange-rates/interfaces/exchange-rate-api.interface';
import { supportCurrencyList } from './constants/support-currency.constant';
import { IExchangeRateDaily } from './interface/exchange-rate-daily.interface';

@Injectable()
export class ExchangeRateService {
  private subscriptions = new Map<string, Set<string>>();
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly supportCurrencyList = supportCurrencyList;

  constructor(
    @Inject('EXCHANGE_RATE_API')
    private readonly exchangeRateExternalAPI: IExchangeRateAPIService,
    private readonly exchangeRateRepository: ExchangeRateRepository,
    private readonly exchangeRateDailyRepository: ExchangeRateDailyRepository,
    private readonly dateUtilService: DateUtilService,
  ) {}

  async getCurrencyExchangeRates(
    input: CurrentExchangeRateReqDto,
  ): Promise<CurrentExchangeRateResDto> {
    const targetCodes = input.currencyCodes?.length
      ? input.currencyCodes
      : this.supportCurrencyList;
    const today = new Date();
    const [latestRates, fluctuationRates] = await Promise.all([
      this.exchangeRateExternalAPI.getLatestRates(
        input.baseCurrency,
        targetCodes,
      ),
      this.exchangeRateExternalAPI.getFluctuationData(
        this.dateUtilService.getYesterday(today),
        today,
        input.baseCurrency,
        targetCodes,
      ),
    ]);

    const dailyCurrencyAggregate = this.generateDailyData(
      latestRates.rates,
      fluctuationRates.rates,
    );

    return {
      baseCurrency: latestRates.baseCurrency,
      rates: dailyCurrencyAggregate,
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
   *  - if there is missing data, call external API
   *  - save the data collcted at this context to the DB
   *  - response data just put in to the client
   */
  async getHistoricalRates(
    input: CurrentExchangeHistoryReqDto,
  ): Promise<ExchangeRatesDailyEntity[]> {
    // 1
    const historicalDataFromDB =
      await this.exchangeRateDailyRepository.findDailyRates({
        baseCurrency: input.baseCurrency,
        currencyCode: input.currencyCode,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
      });

    // 2
    const requestedDates: Date[] = this.dateUtilService.getDatesBeetween(
      input.startedAt,
      input.endedAt,
    );
    const existingDates = historicalDataFromDB.map(
      (entity) => entity.ohlcDate.toISOString().split('T')[0],
    );
    const missingDates = requestedDates.filter(
      (date) => !existingDates.includes(date.toISOString().split('T')[0]),
    );
    const missingDailyData = await Promise.all(
      missingDates.map(async (date) => {
        const yesterday = this.dateUtilService.getYesterday(date);
        const fluctuationData =
          await this.exchangeRateExternalAPI.getFluctuationData(
            yesterday,
            date,
            input.baseCurrency,
            [input.currencyCode],
          );
        const fluctuation = fluctuationData.rates[input.currencyCode];

        const dailyData: IExchangeRateDaily.ICreate = {
          baseCurrency: input.baseCurrency,
          currencyCode: input.currencyCode,
          ohlcDate: date,
          openRate: fluctuation.startRate,
          closeRate: fluctuation.endRate,
          // TODO: calcuate high or low data from exchange_rate table
          highRate: Math.max(fluctuation.startRate, fluctuation.endRate),
          lowRate: Math.min(fluctuation.startRate, fluctuation.endRate),
          avgRate: (fluctuation.startRate + fluctuation.endRate) / 2,
          rateCount: 1,
        };
        return dailyData;
      }),
    );
    const validMissingDailyData = missingDailyData.filter(
      (data) => data !== null,
    );
    if (validMissingDailyData.length > 0) {
      await this.exchangeRateDailyRepository.saveDailyRates(
        validMissingDailyData,
      );
    }

    return await this.exchangeRateDailyRepository.findDailyRates({
      baseCurrency: input.baseCurrency,
      currencyCode: input.currencyCode,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
    });
  }

  /**
   * OHLC data aggregate on a specific date
   */
  async aggregateDailyRates(startDate: Date, endDate: Date): Promise<void> {
    const allFluctuationData = await Promise.all(
      this.supportCurrencyList.map(async (baseCurrency) => {
        const targetCurrencies = this.supportCurrencyList.filter(
          (currency) => currency !== baseCurrency,
        );

        return this.exchangeRateExternalAPI.getFluctuationData(
          startDate,
          endDate,
          baseCurrency,
          targetCurrencies,
        );
      }),
    );

    const fluctuationData =
      await this.exchangeRateExternalAPI.getFluctuationData(startDate, endDate);

    const dailyRecords: IExchangeRateDaily.ICreate[] = Object.entries(
      fluctuationData.rates,
    ).map(([currency, data]) => ({
      baseCurrency: fluctuationData.baseCurrency,
      currencyCode: currency,
      ohlcDate: startDate,
      openRate: data.startRate,
      closeRate: data.endRate,
      highRate: Math.max(data.startRate, data.endRate),
      lowRate: Math.min(data.startRate, data.endRate),
      avgRate: (data.startRate + data.endRate) / 2,
      rateCount: 1,
    }));

    await this.exchangeRateDailyRepository.saveDailyRates(dailyRecords);
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

    this.supportCurrencyList.map(async (majorBaseCurrency) => {
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
        // this.cacheService.setLatestRateCache(res),
      ]);
    });
  }

  /**
   * Gernerate daily data by combining recent currency-rate and fluctuation rate
   * @param latestRates (Record<string, number>)
   * @param fluctuationRates (Record<string, TFluctuation>)
   */
  private generateDailyData(
    latestRates: IExchangeRateExternalAPI.ILatestRatesResponse['rates'],
    fluctuationRates: IExchangeRateExternalAPI.IFluctuationResponse['rates'],
  ): Record<string, RateDetail> {
    return Object.keys(latestRates).reduce<Record<string, RateDetail>>(
      (acc, currency) => {
        const rate = latestRates[currency];
        const fluctuation = fluctuationRates[currency];

        acc[currency] = {
          name: getCurrencyNameInKorean(currency),
          rate,
          dayChange: fluctuation.change,
          dayChangePercent: fluctuation.changePct,
          high24h: Math.max(fluctuation.startRate, fluctuation.endRate),
          low24h: Math.min(fluctuation.startRate, fluctuation.endRate),
        };

        return acc;
      },
      {},
    );
  }

  /**
   * create subscribe about currency pair
   * if subscribe is empty, create new subscribe and insert new client(subscriber)
   */
  subscribe(clientId: string, dto: ExchangeRateSubscribeDto) {
    const pair = `${dto.baseCurrency}/${dto.currencyCode}`;
    if (!this.subscriptions.has(pair)) {
      this.subscriptions.set(pair, new Set());
    }
    this.subscriptions.get(pair)?.add(clientId);

    this.logger.verbose(`${clientId} has subscribe to ${pair}`);
  }

  /**
   * remove subscription if dosen't have any client(subscriber)
   */
  unsubscribe(clientId: string, dto: ExchangeRateSubscribeDto) {
    const pair = `${dto.baseCurrency}/${dto.currencyCode}`;
    if (this.subscriptions.has(pair)) {
      this.subscriptions.get(pair)?.delete(clientId);
      if (this.subscriptions.get(pair)?.size === 0) {
        this.subscriptions.delete(pair);
      }
    }

    this.logger.verbose(`${clientId} has unsubscribed from ${pair}`);
  }

  /**
   * remove all subscription of client
   */
  unsubscribeAll(clientId: string) {
    this.subscriptions.forEach((clients, pair) => {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.subscriptions.delete(pair);
      }
    });

    this.logger.verbose(`All subscriptions removed for client ${clientId}`);
  }
}
