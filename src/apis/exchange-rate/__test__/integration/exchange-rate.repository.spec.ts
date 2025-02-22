import { Test } from '@nestjs/testing';
import { ExchangeRateRepository } from '../../repositores/exchange-rate.repository';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';
import { IExchangeRate } from '../../interface/exchange-rate.interface';
import { PrismaClient } from '@prisma/client';
import { TEST_PRISMA_TOKEN } from '../../../../../test/integration/modules/test-prisma.module';
import { ExchangeRatesEntity } from '../../entitites/exchange-rate.entity';

describe('ExchangeRateRepository Integration', () => {
  let exchangeRateRepository: ExchangeRateRepository;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [ExchangeRateRepository],
    }).compile();

    exchangeRateRepository = module.get(ExchangeRateRepository);
    prisma = module.get(TEST_PRISMA_TOKEN);
  });

  describe('findRatesByDate', () => {
    beforeEach(async () => {
      await prisma.exchangeRates.createMany({
        data: [
          {
            baseCurrency: 'KRW',
            currencyCode: 'EUR',
            rate: 1300.5,
            createdAt: new Date('2025-01-01'),
          },
          {
            baseCurrency: 'KRW',
            currencyCode: 'EUR',
            rate: 1302.2,
            createdAt: new Date('2025-01-01'),
          },
          {
            baseCurrency: 'KRW',
            currencyCode: 'EUR',
            rate: 1310.7,
            createdAt: new Date('2025-01-02'),
          },
          {
            baseCurrency: 'KRW',
            currencyCode: 'EUR',
            rate: 1310.7,
            createdAt: new Date('2025-01-03'),
          },
        ],
      });
    });

    it('should return records about specific date', async () => {
      // Arrange
      const input: IExchangeRate.IFindByDate = {
        baseCurrency: 'KRW',
        currencyCode: 'EUR',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
      };
      const rateEntitySpy = jest.spyOn(ExchangeRatesEntity, 'from');

      // Act
      const act = await exchangeRateRepository.findRatesByDate(input);

      // Assert
      expect(rateEntitySpy).toHaveBeenCalled();

      expect(act).toBeInstanceOf(Array<ExchangeRatesEntity>);
      expect(act[0]).toMatchObject({
        baseCurrency: 'KRW',
        currencyCode: 'EUR',
        rate: expect.any(Number),
      });
      expect(act).toHaveLength(2);
    });

    it('should return empty array when db has no data', async () => {
      // Arrange
      const input: IExchangeRate.IFindByDate = {
        baseCurrency: 'KRW',
        currencyCode: 'EUR',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-03'),
      };
      const rateEntitySpy = jest.spyOn(ExchangeRatesEntity, 'from');

      // Act
      const act = await exchangeRateRepository.findRatesByDate(input);

      // Assert
      expect(rateEntitySpy).not.toHaveBeenCalled();

      expect(act).toHaveLength(0);
    });

    it('should return empty array when date is same', async () => {
      // Arrange
      const input: IExchangeRate.IFindByDate = {
        baseCurrency: 'KRW',
        currencyCode: 'EUR',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-01'),
      };
      const rateEntitySpy = jest.spyOn(ExchangeRatesEntity, 'from');

      // Act
      const act = await exchangeRateRepository.findRatesByDate(input);

      // Assert
      expect(rateEntitySpy).not.toHaveBeenCalled();

      expect(act).toHaveLength(0);
    });
  });
});
