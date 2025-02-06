import { Test } from '@nestjs/testing';
import { ExchangeRateRepository } from '../../repositores/exchange-rate.repository';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';

describe('ExchangeRateRepository Integration', () => {
  let exchangeRateRepository: ExchangeRateRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [ExchangeRateRepository],
    }).compile();

    exchangeRateRepository = module.get(ExchangeRateRepository);
  });

  it('should be defined', () => {
    expect(exchangeRateRepository).toBeDefined();
  });
});
