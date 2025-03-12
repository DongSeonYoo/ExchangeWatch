import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CurrentExchangeRateReqDto,
  CurrentExchangeRateResDto,
  RateDetail,
} from './dto/exchange-rates.dto';
import { ExchangeRateDailyRepository } from './repositores/exchange-rate-daily.repository';
import { CurrentExchangeHistoryReqDto } from './dto/exchange-rates-history.dto';
import { DateUtilService } from '../../utils/date-util/date-util.service';
import { getCurrencyNameInKorean } from './mapper/symbol-kr.mapper';
import {
  IFluctuationExchangeRateApi,
  ILatestExchangeRateApi,
} from '../../externals/exchange-rates/interfaces/exchange-rate-rest-api.interface';
import { IExchangeRateExternalAPI } from '../../externals/exchange-rates/interfaces/exchange-rate-api.interface';
import { supportCurrencyList } from './constants/support-currency.constant';
import { IExchangeRateDaily } from './interface/exchange-rate-daily.interface';
import { ExchangeRateRedisService } from '../../redis/services/exchange-rate-redis.service';
import { ExchangeRateRawRepository } from './repositores/exchange-rate-raw.repository';

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly supportCurrencyList = supportCurrencyList;

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

  async getCurrencyExchangeRates(
    input: CurrentExchangeRateReqDto,
  ): Promise<CurrentExchangeRateResDto> {
    const targetCodes = input.currencyCodes?.length
      ? input.currencyCodes
      : this.supportCurrencyList;
    const today = new Date();
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
      .getDatesBeetween(input.startedAt, input.endedAt)
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
          rate: latestRate,
          timestamp: latestTimestamp,
        },
      );
    } else {
      const prevRate = parseFloat(storedRate);
      const storedDate = new Date(storedTimestamp);
      const latestDate = new Date(latestTimestamp);
      const isNewDay = this.dateUtilService.isBefore(latestDate, storedDate);

      // 날짜가 바뀐 경우 변동률 0으로 초기화
      if (isNewDay) {
        await this.exchangeRateRedisService.setLatestRate(
          baseCurrency,
          currencyCode,
          {
            change: 0,
            changePct: 0,
            rate: latestRate,
            timestamp: latestTimestamp,
          },
        );
        this.logger.debug('날짜가 바뀌어서 변동률을 초기화했습니다');
      } else {
        // 같은 거래일인 경우, 변동률 계산
        const change = latestRate - prevRate;
        const changePct = (change / prevRate) * 100;

        // 변동률이 일정치 이상이면 업데이트
        // @TODO 변화감지량 상수화
        if (Math.abs(changePct) > 0.01) {
          await this.exchangeRateRedisService.setLatestRate(
            baseCurrency,
            currencyCode,
            {
              change: change,
              changePct: changePct,
              rate: latestRate,
              timestamp: latestTimestamp,
            },
          );
          this.logger.debug('가격이 변동되었으니 업데이트칩니다');
        }
      }
    }

    // 레코드 삽입 (default-postgres)
    return await this.exchangeRateRawRepository.createExchangeRate({
      baseCurrency: baseCurrency,
      currencyCode: currencyCode,
      rate: latestRate,
    });
  }
}
