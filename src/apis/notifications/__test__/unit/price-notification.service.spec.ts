import { Test } from '@nestjs/testing';
import { NotificationRepository } from '../../notification.repository';
import { mock, MockProxy } from 'jest-mock-extended';
import { MaxNotificationCountException } from '../../exceptions/max-notification-count.exception';
import { NotificationService } from '../../notification.service';
import { NotificationEntity } from '../../entities/notification.entity';
import { AlreadyRegisterNotificationException } from '../../exceptions/arleady-notification.exception';

describe('PriceNotificationService (unit)', () => {
  let notificationService: NotificationService;
  let priceNotificationRepository: MockProxy<NotificationRepository>;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationRepository,
          useFactory: () => mock<NotificationRepository>(),
        },
      ],
    }).compile();

    notificationService = app.get(NotificationService);
    priceNotificationRepository = app.get(NotificationRepository);
  });

  it('should be definded', () => {
    expect(notificationService).toBeDefined();
  });

  describe('createPriceNotification', () => {
    it('should throw an error if the user has reached the maximum notification count', async () => {
      // Arrange
      const input = {
        baseCurrency: 'USD',
        currencyCode: 'KRW',
        targetPrice: 1000,
      };
      const userIdx = 1;

      priceNotificationRepository.getUserNotificationsCount.mockResolvedValue(
        10,
      );
      priceNotificationRepository.getUserNotifications.mockResolvedValue([]);

      // Act
      const act = async () =>
        await notificationService.createPriceNotification(input, userIdx);

      // Assert
      await expect(act).rejects.toThrow(MaxNotificationCountException);
    });

    it('should throw an error if the user already has a notification with the same price and currency pair', async () => {
      // Arragne
      const input = {
        baseCurrency: 'USD',
        currencyCode: 'KRW',
        targetPrice: 1000,
      };
      const userIdx = 1;

      priceNotificationRepository.getUserNotificationsCount.mockResolvedValue(
        9,
      );
      priceNotificationRepository.getUserNotifications.mockResolvedValue([
        {
          notificationData: {
            baseCurrency: 'USD',
            currencyCode: 'KRW',
            targetPrice: 1000,
          },
        },
      ] as NotificationEntity<'TARGET_PRICE'>[]);

      // Act
      const act = async () =>
        await notificationService.createPriceNotification(input, userIdx);

      // Assert
      expect(act).rejects.toThrow(AlreadyRegisterNotificationException);
    });

    it('should successfully create price notification', async () => {
      // Arrange
      const input = {
        baseCurrency: 'USD',
        currencyCode: 'KRW',
        targetPrice: 1000,
      };
      const userIdx = 1;

      priceNotificationRepository.getUserNotificationsCount.mockResolvedValue(
        0,
      );
      priceNotificationRepository.getUserNotifications.mockResolvedValue([
        {
          notificationData: {
            baseCurrency: 'USD',
            currencyCode: 'KRW',
            targetPrice: 1200,
          },
        },
      ] as NotificationEntity<'TARGET_PRICE'>[]);

      const getUserNotiSpy = jest.spyOn(
        priceNotificationRepository,
        'getUserNotifications',
      );
      const getNotiCountSpy = jest.spyOn(
        priceNotificationRepository,
        'getUserNotificationsCount',
      );
      const createNotispy = jest.spyOn(
        priceNotificationRepository,
        'createNotification',
      );

      // Act
      const result = await notificationService.createPriceNotification(
        input,
        userIdx,
      );

      // Assert
      expect(getUserNotiSpy).toHaveBeenCalled();
      expect(getNotiCountSpy).toHaveBeenCalled();
      expect(createNotispy).toHaveBeenCalledWith({
        notificationData: {
          baseCurrency: 'USD',
          currencyCode: 'KRW',
          targetPrice: 1000,
        },
        notificationType: 'TARGET_PRICE',
        userIdx: 1,
      });
    });
  });
});
