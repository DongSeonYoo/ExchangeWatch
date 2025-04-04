import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { ExchangeRateDailyRepository } from '../../repositories/exchange-rate-daily.repository';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';
import { TEST_PRISMA_TOKEN } from '../../../../../test/integration/modules/test-prisma.module';

describe('ExchangeRateDailyRepository (Integration)', () => {
  let exchangeRateDailyRepository: ExchangeRateDailyRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [ExchangeRateDailyRepository],
    }).compile();

    exchangeRateDailyRepository = module.get(ExchangeRateDailyRepository);
    prisma = module.get(TEST_PRISMA_TOKEN);
  });

  it('should be defined', () => {
    expect(exchangeRateDailyRepository).toBeDefined();
  });
});
