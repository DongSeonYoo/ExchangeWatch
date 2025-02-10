import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateService } from '../../exchange-rate.service';
import { RedisService } from '../../../../redis/redis.service';
import { ExchangeRateRepository } from '../../repositores/exchange-rate.repository';
import { ExchangeRateDailyRepository } from '../../repositores/exchange-rate-daily.repository';
import { DateUtilService } from '../../../../utils/date-util/date-util.service';
import { instance, mock } from 'ts-mockito';
import { IExchangeRateAPIService } from '../../../../externals/exchange-rates/interfaces/exchange-rate-api-service';
import { mockExchangeRateAPI } from '../../../../../test/unit/setup';

describe('ExchangeRateService', () => {
  let exchangeRateService: ExchangeRateService;
  let redisService = mock(RedisService);
  let exchangeRateRepository = mock(ExchangeRateRepository);
  let exchangeRateDailyRepository = mock(ExchangeRateDailyRepository);
  let dateUtilService = mock(DateUtilService);

  let exchangeRateAPI: IExchangeRateAPIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        {
          provide: RedisService,
          useValue: instance(redisService),
        },
        {
          provide: ExchangeRateRepository,
          useValue: instance(exchangeRateRepository),
        },
        {
          provide: ExchangeRateDailyRepository,
          useValue: instance(exchangeRateDailyRepository),
        },
        {
          provide: 'EXCHANGE_RATE_API',
          useValue: mockExchangeRateAPI,
        },
        {
          provide: DateUtilService,
          useValue: instance(dateUtilService),
        },
      ],
    }).compile();

    exchangeRateService = module.get(ExchangeRateService);
    exchangeRateAPI = module.get('EXCHANGE_RATE_API');
  });

  it('should be defined', () => {
    expect(exchangeRateService).toBeDefined();
  });
});
