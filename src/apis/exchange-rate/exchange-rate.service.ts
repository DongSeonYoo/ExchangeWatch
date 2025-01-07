import { Injectable } from '@nestjs/common';
import { MockFixerService } from '../fixer/mock/fixer-mock.service';
import { ExchangeRateRepository } from './exchange-rate.repository';
import { IExchangeRate } from './interface/exchange-rate.interface';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class ExchangeRateService {
  constructor(
    private readonly fixerService: MockFixerService,
    private readonly exchangeRateRepository: ExchangeRateRepository,
    private readonly redisService: RedisService,
  ) {}

  async getCurrencyExchangeRates(
    baseCurrency: string,
    currencyCodes?: string[],
  ) {
    const [latestRates, fluctuationRates] = await Promise.all([
      this.fixerService.getLatestRates(baseCurrency, currencyCodes),
      this.fixerService.getFluctuationRates(new Date(), new Date()),
    ]);

    return {
      latestRates,
      fluctuationRates,
    };
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
    const records: IExchangeRate.ICreateMany = Object.entries(rates.rates).map(
      ([currencyCode, rate]) => ({
        baseCurrency,
        currencyCode,
        rate,
      }),
    );

    // TODO: distribute transaction & analize excution time
    await Promise.all([
      this.exchangeRateRepository.intertMany(records),
      this.redisService.updateLatestRateCache(records),
    ]);
  }
}
