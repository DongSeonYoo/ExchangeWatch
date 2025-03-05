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
    @Inject('LATEST_EXCHANGE_RATE_API')
    private readonly latestExchangeRateAPI: ILatestExchangeRateApi,
    @Inject('FLUCTUATION_RATE_API')
    private readonly fluctuationRateAPI: IFluctuationExchangeRateApi,
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
