import { Test } from '@nestjs/testing';
import { ExchangeRateRedisService } from '../../services/exchange-rate-redis.service';
import { TestIntegrateModules } from '../../../../test/integration/utils/integrate-module.util';
import { IRedisSchema } from '../../interfaces/redis-schema.interface';
import typia from 'typia';

describe('ExchangeRateRedisService (Integration)', () => {
  let exchangeRateRedisService: ExchangeRateRedisService;
  let latestRateKey = 'latest-rate';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [ExchangeRateRedisService],
    }).compile();

    exchangeRateRedisService = module.get(ExchangeRateRedisService);
  });

  it('should definded ExchangeRateRedisService', () => {
    expect(exchangeRateRedisService).toBeDefined();
  });

  describe('getLatestRate', () => {
    // Arrange
    let baseCurrency: string;
    let currencyCode: string;

    beforeEach(async () => {
      baseCurrency = 'EUR';
      currencyCode = 'KRW';

      await exchangeRateRedisService.setLatestRate(baseCurrency, currencyCode, {
        change: 0,
        changePct: 0,
        rate: 1500,
        timestamp: new Date('2001-06-12').getTime(),
      });
    });

    it('should return hash fields (string) of currency pair', async () => {
      // Arrange

      // Act
      const result = await exchangeRateRedisService.getLatestRate(
        baseCurrency,
        currencyCode,
        {
          change: true,
          changePct: true,
          rate: true,
          timestamp: true,
        },
      );

      // Assert
      expect(result).toHaveLength(4);
      expect(() => typia.assertEquals<string[]>(result)).not.toThrow();
      expect(result).toStrictEqual([
        '0',
        '0',
        '1500',
        String(new Date('2001-06-12').getTime()),
      ]);
    });

    it('should return only the specified hash fields', async () => {
      // Arrange
      // Act
      const result = await exchangeRateRedisService.getLatestRate(
        baseCurrency,
        currencyCode,
        {
          change: true,
          changePct: true,
          rate: true,
        },
      );

      // Assert
      expect(() => typia.assertEquals<string[]>(result)).not.toThrow();
      expect(result).not.toHaveLength(2);
      expect(result).toHaveLength(3);
      expect(result).toStrictEqual(['0', '0', '1500']);
    });

    it('should return null array when values aren"t there', async () => {
      // Arrange
      // Act
      const result = await exchangeRateRedisService.getLatestRate(
        baseCurrency,
        currencyCode + 'dongseon',
        {
          change: true,
          changePct: true,
        },
      );

      // Assert
      expect(result).toStrictEqual([null, null]);
      expect(() => typia.assertEquals<null[]>(result)).not.toThrow();
    });
  });

  describe('setLatestRate', () => {
    it('should save currency pairs as hash', async () => {
      // Arrange
      const baseCurrency = 'EUR';
      const currencyCode = 'KRW';

      // Act
      await exchangeRateRedisService.setLatestRate(baseCurrency, currencyCode, {
        change: -300,
        changePct: -20,
        rate: 1200,
        timestamp: new Date('2001-06-12').getTime(),
      });

      const [change, changePct, rate, timestamp] =
        await exchangeRateRedisService.getLatestRate(
          baseCurrency,
          currencyCode,
          {
            change: true,
            changePct: true,
            rate: true,
            timestamp: true,
          },
        );

      // Assert
      expect(change).toBe('-300');
      expect(changePct).toBe('-20');
      expect(rate).toEqual('1200');
      expect(timestamp).toEqual(String(new Date('2001-06-12').getTime()));
    });
  });
});
