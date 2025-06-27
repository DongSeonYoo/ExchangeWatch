import { Test } from '@nestjs/testing';
import { NotificationRepository } from '../../notification.repository';
import { mock, MockProxy } from 'jest-mock-extended';
import { MaxNotificationCountException } from '../../exceptions/max-notification-count.exception';
import { PriceNotificationService } from '../../services/price-notification.service';
import { NotificationEntity } from '../../entities/notification.entity';
import { AlreadyRegisterNotificationException } from '../../exceptions/arleady-notification.exception';
import { SelectPriceNotificationReqDto } from '../../dtos/price-notification/select-price-notification.dto';

describe('PriceNotificationService (unit)', () => {
  let notificationService: PriceNotificationService;
  let notificationRepository: MockProxy<NotificationRepository>;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        PriceNotificationService,
        {
          provide: NotificationRepository,
          useFactory: () => mock<NotificationRepository>(),
        },
      ],
    }).compile();

    notificationService = app.get(PriceNotificationService);
    notificationRepository = app.get(NotificationRepository);
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

      notificationRepository.getUserNotificationsCount.mockResolvedValue(10);
      notificationRepository.getUserNotifications.mockResolvedValue([]);

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

      notificationRepository.getUserNotificationsCount.mockResolvedValue(9);
      notificationRepository.getUserNotifications.mockResolvedValue([
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

      notificationRepository.getUserNotificationsCount.mockResolvedValue(0);
      notificationRepository.getUserNotifications.mockResolvedValue([
        {
          notificationData: {
            baseCurrency: 'USD',
            currencyCode: 'KRW',
            targetPrice: 1200,
          },
        },
      ] as NotificationEntity<'TARGET_PRICE'>[]);

      const getUserNotiSpy = jest.spyOn(
        notificationRepository,
        'getUserNotifications',
      );
      const getNotiCountSpy = jest.spyOn(
        notificationRepository,
        'getUserNotificationsCount',
      );
      const createNotispy = jest.spyOn(
        notificationRepository,
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

  describe('getPriceNotificationList', () => {
    it('should return notification list based on offset', async () => {
      // Arragne
      const input = new SelectPriceNotificationReqDto();
      input.page = 3;
      input.limit = 10;
      const userIdx = 1;

      notificationRepository.getNotificationsWithOffset.mockResolvedValue([
        { idx: 'abc123', createdAt: new Date() },
        { idx: 'abc123', createdAt: new Date() },
      ] as NotificationEntity[]);

      // Act
      const repospy = jest.spyOn(
        notificationRepository,
        'getNotificationsWithOffset',
      );
      const result = await notificationService.getPriceNotificationList(
        input,
        userIdx,
      );

      // Assert
      expect(repospy).toHaveBeenCalledWith({
        userIdx: 1,
        limit: 10,
        offset: 20,
        notificationType: 'TARGET_PRICE',
      });

      expect(result.items).toHaveLength(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
    });

    it('should return empty array when db has no data ', async () => {
      // Arrange
      const input = new SelectPriceNotificationReqDto();
      input.page = 4;
      input.limit = 10;
      const userIdx = 1;

      notificationRepository.getNotificationsWithOffset.mockResolvedValue(
        [] as NotificationEntity[],
      );

      // Act
      const result = await notificationService.getPriceNotificationList(
        input,
        userIdx,
      );

      // Assert
      expect(result.items).toHaveLength(0);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(30);
    });
  });
});
