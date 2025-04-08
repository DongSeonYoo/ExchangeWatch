import { Test } from '@nestjs/testing';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';
import typia from 'typia';
import { ExchangeRateRedisService } from '../../services/exchange-rate-redis.service';
import { RedisService } from '../../../../infrastructure/redis/redis.service';

describe('ExchangeRateRedisService (Integration)', () => {
  let redisService: RedisService;
  let exchangeRateRedisService: ExchangeRateRedisService;
  let baseCurrency: string = 'EUR';
  let currencyCode: string = 'KRW';
  const latestRateKey = `latest-rate:`;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [RedisService, ExchangeRateRedisService],
    }).compile();

    redisService = module.get(RedisService);
    exchangeRateRedisService = module.get(ExchangeRateRedisService);
  });

  afterEach(async () => {
    await redisService.del(`latest-rate:${baseCurrency}/${currencyCode}`);
  });

  it('should definded ExchangeRateRedisService', () => {
    expect(exchangeRateRedisService).toBeDefined();
  });

  describe('getLatestRate', () => {
    // Arrange
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

  describe('updateLatestRate', () => {
    it('should update only the specified hash fields', async () => {
      // Arrange
      await exchangeRateRedisService.setLatestRate(baseCurrency, currencyCode, {
        change: -300,
        changePct: -20,
        rate: 1200,
        timestamp: new Date('2001-06-12').getTime(),
      });

      // Act
      await exchangeRateRedisService.updateLatestRate(
        baseCurrency,
        currencyCode,
        // partial updates
        {
          change: -100,
          changePct: -10,
        },
      );

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
      expect(change).toBe('-100');
      expect(changePct).toBe('-10');
      expect(rate).toEqual('1200');
      expect(timestamp).toEqual(String(new Date('2001-06-12').getTime()));
    });

    it('should not update when the field is not specified', async () => {
      // Arrange
      const baseCurrency = 'EUR';
      const currencyCode = 'KRW';

      await exchangeRateRedisService.setLatestRate(baseCurrency, currencyCode, {
        change: -300,
        changePct: -20,
        rate: 1200,
        timestamp: new Date('2001-06-12').getTime(),
      });

      // Act
      await exchangeRateRedisService.updateLatestRate(
        baseCurrency,
        currencyCode,
        // partial updates
        {
          change: -100,
        },
      );

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
      expect(change).toBe('-100');
      expect(changePct).toBe('-20');
      expect(rate).toEqual('1200');
      expect(timestamp).toEqual(String(new Date('2001-06-12').getTime()));
    });
  });

  describe('publishRateUpdate', () => {
    it('should publish updated rate to channel', async () => {
      // Arrange
      const rateUpdate = {
        rate: 1234.56,
        timestamp: new Date(),
      };

      // Act
      const result = await exchangeRateRedisService.publishRateUpdate(
        baseCurrency,
        currencyCode,
        rateUpdate as any,
      );

      // Assert
      // 구독자가 없으니 당연히 0이겠
      expect(result).toBe(0);
    });
  });
});
