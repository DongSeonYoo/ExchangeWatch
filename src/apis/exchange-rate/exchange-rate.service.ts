import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { MockFixerService } from '../fixer/mock/fixer-mock.service';
import { DateUtilService } from '../../utils/date-util/date-util.service';

@Injectable()
export class ExchangeRateService {
  constructor(
    private readonly fixerService: MockFixerService,
    private readonly redisService: RedisService,
    private readonly dateUtilService: DateUtilService,
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
}
