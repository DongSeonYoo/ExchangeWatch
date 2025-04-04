import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { ExchangeRateRawRepository } from '../../repositories/exchange-rate-raw.repository';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';
import { TEST_PRISMA_TOKEN } from '../../../../../test/integration/modules/test-prisma.module';

describe('ExchangeRateRawRepository (Integration)', () => {
  let exchangeRateRawRepository: ExchangeRateRawRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [ExchangeRateRawRepository],
    }).compile();

    exchangeRateRawRepository = module.get(ExchangeRateRawRepository);
    prisma = module.get(TEST_PRISMA_TOKEN);
  });

  it('should be defined', () => {
    expect(exchangeRateRawRepository).toBeDefined();
  });
});
