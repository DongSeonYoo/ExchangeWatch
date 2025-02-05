import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateService } from '../../exchange-rate.service';
import { MockFixerService } from '../../../../externals/exchange-rates/fixer/fixer-mock.service';
import { RedisService } from '../../../../redis/redis.service';
import { ExchangeRateRepository } from '../../repositores/exchange-rate.repository';
import { ExchangeRateDailyRepository } from '../../repositores/exchange-rate-daily.repository';
import { DateUtilService } from '../../../../utils/date-util/date-util.service';
import { instance, mock } from 'ts-mockito';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  let mockFixerService = mock(MockFixerService);
  let redisService = mock(RedisService);
  let exchangeRateRepository = mock(ExchangeRateRepository);
  let exchangeRateDailyRepository = mock(ExchangeRateDailyRepository);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        DateUtilService,
        {
          provide: MockFixerService,
          useValue: instance(mockFixerService),
        },
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
      ],
    }).compile();

    service = module.get<ExchangeRateService>(ExchangeRateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('when occured error about external API', () => {
    it.todo('should handle error when occured latestRates API');
    it.todo('should handle error when occured fluctuation API');
  });
});
