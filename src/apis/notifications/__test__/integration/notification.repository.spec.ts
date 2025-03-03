import { Test } from '@nestjs/testing';
import { NotificationRepository } from '../../notification.repository';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';
import { PrismaClient } from '@prisma/client';
import { TEST_PRISMA_TOKEN } from '../../../../../test/integration/modules/test-prisma.module';
import typia from 'typia';
import { NotificationEntity } from '../../entities/notification.entity';

describe('PriceNotificationRepotisory (integrate)', () => {
  let notificationRepository: NotificationRepository;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [NotificationRepository],
    }).compile();

    notificationRepository = app.get(NotificationRepository);
    prisma = app.get(TEST_PRISMA_TOKEN);
  });

  beforeEach(async () => {
    await prisma.notifications.createMany({
      data: [
        {
          userIdx: 1,
          notificationType: 'TARGET_PRICE',
          notificationData: {
            baseCurrency: 'KRW',
            currencyCode: 'EUR',
            targetPrice: 1500,
          },
        },
        {
          userIdx: 1,
          notificationType: 'TARGET_PRICE',
          notificationData: {
            baseCurrency: 'KRW',
            currencyCode: 'EUR',
            targetPrice: 1502,
          },
        },
        {
          userIdx: 1,
          notificationType: 'TARGET_PRICE',
          notificationData: {
            baseCurrency: 'KRW',
            currencyCode: 'EUR',
            targetPrice: 1503,
          },
        },
        {
          userIdx: 2,
          notificationType: 'DAILY_REPORT',
          notificationData: {
            currencies: ['KRW', 'EUR'],
            deliveryTime: '09:00',
          },
        },
        {
          userIdx: 2,
          notificationType: 'TARGET_PRICE',
          notificationData: {
            baseCurrency: 'USD',
            currencyCode: 'EUR',
            targetPrice: 1000,
          },
        },
      ],
    });
  });

  describe('getUserNotificationCount', () => {
    it("should return user's notification count", async () => {
      // Arrange
      const userIdx = 1;

      // Act
      const act =
        await notificationRepository.getUserNotificationsCount(userIdx);

      // Assert
      expect(act).toBe(3);
    });

    it.todo('soft delete');
  });

  describe('getUserNotifications', () => {
    it('should return only "TARGET_PRICE" notifications for user 1', async () => {
      // Arragne

      // Act
      const act = await notificationRepository.getUserNotifications({
        userIdx: 1,
        notificationType: 'TARGET_PRICE',
      });

      // Assert
      expect(() =>
        typia.assertEquals<Array<NotificationEntity<'TARGET_PRICE'>>>(act),
      ).not.toThrow();
      expect(act.map((res) => res.notificationData.targetPrice)).toEqual([
        1500, 1502, 1503,
      ]);
      expect(act).toHaveLength(3);
    });

    it('should return only "DAILY_REPORT" notifications for user 1', async () => {
      // Arrange

      // Act
      const act = await notificationRepository.getUserNotifications({
        userIdx: 2,
        notificationType: 'DAILY_REPORT',
      });

      // Assert
      expect(() =>
        typia.assertEquals<Array<NotificationEntity<'DAILY_REPORT'>>>(act),
      ).not.toThrow();
      expect(act).toHaveLength(1);
    });

    it('should return empty array for non-exist user', async () => {
      // Arrange

      // non-extist user
      const userIdx = 3;

      // Act
      const result = await notificationRepository.getUserNotifications({
        userIdx: userIdx,
        notificationType: 'TARGET_PRICE',
      });

      // Assert
      expect(() => typia.assertEquals<[]>(result)).not.toThrow();
      expect(result).toEqual([]);
    });
  });

  describe('getNotificationsWithOffset', () => {
    // default limit = 10
    // 13 notifications of user 1;
    beforeEach(async () => {
      await prisma.notifications.createMany({
        data: [
          {
            userIdx: 1,
            notificationType: 'TARGET_PRICE',
            notificationData: {
              targetPrice: 1600,
              baseCurrency: 'KRW',
              currencyCode: 'EUR',
            },
          },
          {
            userIdx: 1,
            notificationType: 'TARGET_PRICE',
            notificationData: {
              targetPrice: 1601,
              baseCurrency: 'KRW',
              currencyCode: 'EUR',
            },
          },
          {
            userIdx: 1,
            notificationType: 'TARGET_PRICE',
            notificationData: {
              targetPrice: 1602,
              baseCurrency: 'KRW',
              currencyCode: 'EUR',
            },
          },
          {
            userIdx: 1,
            notificationType: 'TARGET_PRICE',
            notificationData: {
              targetPrice: 1603,
              baseCurrency: 'KRW',
              currencyCode: 'EUR',
            },
          },
          {
            userIdx: 1,
            notificationType: 'TARGET_PRICE',
            notificationData: {
              targetPrice: 1604,
              baseCurrency: 'KRW',
              currencyCode: 'EUR',
            },
          },
          {
            userIdx: 1,
            notificationType: 'TARGET_PRICE',
            notificationData: {
              targetPrice: 1605,
              baseCurrency: 'KRW',
              currencyCode: 'EUR',
            },
          },
          {
            userIdx: 1,
            notificationType: 'TARGET_PRICE',
            notificationData: {
              targetPrice: 1606,
              baseCurrency: 'KRW',
              currencyCode: 'EUR',
            },
          },
          {
            userIdx: 1,
            notificationType: 'TARGET_PRICE',
            notificationData: {
              targetPrice: 1607,
              baseCurrency: 'KRW',
              currencyCode: 'EUR',
            },
          },
          {
            userIdx: 1,
            notificationType: 'TARGET_PRICE',
            notificationData: {
              targetPrice: 1608,
              baseCurrency: 'KRW',
              currencyCode: 'EUR',
            },
          },
          {
            userIdx: 1,
            notificationType: 'TARGET_PRICE',
            notificationData: {
              targetPrice: 1609,
              baseCurrency: 'KRW',
              currencyCode: 'EUR',
            },
          },
        ],
      });
    });

    it('should return first 3 notifications (page=2, offset=20)', async () => {
      // Arrange
      const userIdx = 1;
      const limit = 10;
      const offset = 10;

      // Act
      const result = await notificationRepository.getNotificationsWithOffset({
        userIdx: userIdx,
        limit: limit,
        offset: offset,
      });

      // Assert
      expect(() =>
        typia.assertEquals<NotificationEntity[]>(result),
      ).not.toThrow();
      expect(result).toHaveLength(3);
    });

    it('should return empty array when offset is out of range', async () => {
      // Arrange
      const limit = 10;
      const userIdx = 1;
      const offset = 100;

      // Act
      const result = await notificationRepository.getNotificationsWithOffset({
        userIdx: userIdx,
        notificationType: 'TARGET_PRICE',
        limit: limit,
        offset: offset,
      });

      // Assert
      expect(() => typia.assertEquals<[]>(result)).not.toThrow();
      expect(result).toHaveLength(0);
    });

    it.todo('should not return soft deleted items');
  });
});
