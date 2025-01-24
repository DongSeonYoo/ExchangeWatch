import { Injectable } from '@nestjs/common';
import { MockFixerService } from '../fixer/mock/fixer-mock.service';
import { ExchangeRateRepository } from './repositores/exchange-rate.repository';
import { IExchangeRate } from './interface/exchange-rate.interface';
import { RedisService } from '../../redis/redis.service';
import { RateDetail } from './dto/exchange-rates.dto';
import { IExchangeRateDaily } from './interface/exchange-rate-daily.interface';
import { ExchangeRateDailyRepository } from './repositores/exchange-rate-daily.repository';
import { CurrentExchangeHistoryReqDto } from './dto/exchange-rates-history.dto';

@Injectable()
export class ExchangeRateService {
  constructor(
    private readonly fixerService: MockFixerService,
    private readonly redisService: RedisService,
    private readonly exchangeRateRepository: ExchangeRateRepository,
    private readonly exchangeRateDailyRepository: ExchangeRateDailyRepository,
  ) {}

  async getCurrencyExchangeRates(
    baseCurrency: string,
    currencyCodes?: string[],
  ) {
    const [latestRates, fluctuationRates] = await Promise.all([
      this.fixerService.getLatestRates(baseCurrency, currencyCodes),
      this.fixerService.getFluctuationRates(
        new Date(),
        new Date(),
        baseCurrency,
        currencyCodes,
      ),
    ]);

    const targetCodes = currencyCodes?.length
      ? currencyCodes
      : Object.keys(latestRates.rates);

    const processedRates = targetCodes.reduce<Record<string, RateDetail>>(
      (acc, code) => {
        const rate = latestRates.rates[code];
        const fluctuation = fluctuationRates.rates[code];
        acc[code] = {
          rate: rate,
          dayChange: fluctuation.change,
          dayChangePercent: fluctuation.change_pct,
          high24h: Math.max(fluctuation.start_rate, fluctuation.end_rate),
          low24h: Math.min(fluctuation.start_rate, fluctuation.end_rate),
        };

        return acc;
      },
      {},
    );

    return {
      baseCurrency: latestRates.base,
      rates: processedRates,
    };
  }

  async getHistoricalRates(input: CurrentExchangeHistoryReqDto) {
    return await this.exchangeRateDailyRepository.findDailyRates({
      baseCurrency: input.baseCurrency,
      currencyCode: input.currencyCode,
      endedAt: input.endedAt,
      startedAt: input.startedAt,
    });
  }

  /**
   * OHLC data aggregate on a specific date
   */
  async aggregateDailyRates(startDate: Date, endDate: Date) {
    const fluctuationData = await this.fixerService.getFluctuationRates(
      startDate,
      endDate,
    );

    const dailyStats = await this.exchangeRateRepository.findDailyStats(
      startDate,
      endDate,
    );

    const OHLCdata: IExchangeRateDaily.ICreate[] = dailyStats.map((stats) => {
      const fluctuation = fluctuationData.rates[stats.currencyCode];

      return {
        baseCurrency: stats.baseCurrency,
        currencyCode: stats.currencyCode,
        openRate: fluctuation.start_rate,
        closeRate: fluctuation.end_rate,
        highRate: stats.maxRate,
        lowRate: stats.minRate,
        avgRate: stats.avgRate,
        rateCount: stats.count,
        ohlcDate: startDate,
      };
    });

    await this.exchangeRateDailyRepository.saveDailyRates(OHLCdata);
  }

  /**
   * Performing tasks following caching strategies
   *
   * 1. get latest-rate from external API
   * 2. convert recived data to record for RDB
   * 3. update cache
   */
  async saveLatestRates(): Promise<void> {
    const rates = await this.fixerService.getLatestRates();
    const baseCurrency = rates.base;
    const records: IExchangeRate.ICreate[] = Object.entries(rates.rates).map(
      ([currencyCode, rate]) => ({
        baseCurrency,
        currencyCode,
        rate,
      }),
    );

    // TODO: distribute transaction & analize excution time
    await Promise.all([
      this.exchangeRateRepository.saveLatestRates(records),
      this.redisService.updateLatestRateCache(records),
    ]);
  }
}
