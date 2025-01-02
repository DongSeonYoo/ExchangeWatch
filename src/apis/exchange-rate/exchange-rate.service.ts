import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { MockFixerService } from '../fixer/mock/fixer-mock.service';
import {
  CurrentExchangeRateReqDto,
  CurrentExchangeRateResDto,
} from './dto/current-exchange-rate.dto';
import { DateUtilService } from '../../utils/date-util/date-util.service';

@Injectable()
export class ExchangeRateService {
  constructor(
    private readonly fixerService: MockFixerService,
    private readonly redisService: RedisService,
    private readonly dateUtilService: DateUtilService,
  ) {}

  async getCurrencyExchangeRates(dto: CurrentExchangeRateReqDto) {
    const [latestRates, fluctuationRates] = await Promise.all([
      this.fixerService.getLatestRates(dto.baseCurrency, dto.currencyCodes),
      this.fixerService.getFluctuationRates(new Date(), new Date()),
    ]);

    return CurrentExchangeRateResDto.of(
      latestRates,
      fluctuationRates,
      dto.currencyCodes,
    );
  }
}
