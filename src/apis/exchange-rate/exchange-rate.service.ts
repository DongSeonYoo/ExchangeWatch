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
    const apiResponse = await Promise.all(
      missingDates.map((date) =>
        this.exchangeRateExternalAPI.getFluctuationData(
          this.dateUtilService.getYesterday(date),
          date,
          input.baseCurrency,
          [input.currencyCode],
        ),
      ),
    );

    // convert missingdata for insertable to database
    const dailyRecord: IExchangeRateDaily.ICreate[] = apiResponse.map(
      (res, i) => {
        const fluctuation = res.rates[input.currencyCode];
        const ohlc = this.generateOHLCdata(
          fluctuation.startRate,
          fluctuation.endRate,
          fluctuation.changePct,
        );

        return {
          baseCurrency: input.baseCurrency,
          currencyCode: input.currencyCode,
          ohlcDate: missingDates[i],
          openRate: ohlc.openRate,
          highRate: ohlc.highRate,
          lowRate: ohlc.lowRate,
          closeRate: ohlc.closeRate,
          avgRate: (ohlc.openRate + ohlc.closeRate) / 2,
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
   * - if data are missing, sppply data by calling an external API
   */
  async calculateDailyRates(startDate: Date, endDate: Date) {
    const currencyPairs = this.generateCurrencyPairs(this.supportCurrencyList);

    const ohlcRecords = await Promise.all(
      currencyPairs.map(
        async ({
          baseCurrency,
          currencyCode,
        }): Promise<IExchangeRateDaily.ICreate> => {
          const exchangeRates =
            await this.exchangeRateRepository.findRatesByDate({
              baseCurrency,
              currencyCode,
              startDate: startDate,
              endDate: endDate,
            });

          let ohlcData: {
            openRate: number;
            highRate: number;
            lowRate: number;
            closeRate: number;
          };

          // db에 존재하는 rate 신뢰성 체크 (하루동안 수집된 회수)
          // 만약 수집량이 기준치 이하이다  -> 외부 api call -> OHLC 생성
          // 수집량이 기준치 이상이다 -> db의 값 사용 -> OHLC 생성
          if (exchangeRates.length > 0) {
            ohlcData = this.generateOHLCdata(
              exchangeRates[0].rate,
              exchangeRates[exchangeRates.length - 1].rate,
            );
          } else {
            const apiResponse =
              await this.exchangeRateExternalAPI.getFluctuationData(
                startDate,
                endDate,
                baseCurrency,
                [currencyCode],
              );

            const fluctuation = apiResponse.rates[currencyCode];
            ohlcData = this.generateOHLCdata(
              fluctuation.startRate,
              fluctuation.endRate,
              fluctuation.changePct,
            );
          }

          return {
            baseCurrency,
            currencyCode,
            ohlcDate: startDate,
            openRate: ohlcData.openRate,
            closeRate: ohlcData.closeRate,
            highRate: ohlcData.highRate,
            lowRate: ohlcData.lowRate,
            avgRate: (ohlcData.openRate + ohlcData.closeRate) / 2,
            rateCount: exchangeRates.length || 1,
          };
        },
      ),
    );

    await this.exchangeRateDailyRepository.saveDailyRates(ohlcRecords);
  }

  generateCurrencyPairs(
    currencyList: string[],
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
   * Generate OHLC data by fluctuation data from the external API
   *
   * @param ohlcDate (Date)
   */
  generateOHLCdata(
    startRate: number,
    endRate: number,
    changePct?: number,
  ): {
    openRate: number;
    highRate: number;
    lowRate: number;
    closeRate: number;
  } {
    const highRate =
      changePct !== undefined
        ? startRate * (1 + changePct / 100)
        : Math.max(startRate, endRate);

    const lowRate =
      changePct !== undefined
        ? startRate * (1 - changePct / 100)
        : Math.min(startRate, endRate);

    return {
      openRate: startRate,
      highRate,
      lowRate,
      closeRate: endRate,
    };
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
