import { Test } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { app, messaging } from 'firebase-admin';
import { FcmService } from '../../fcm.service';
import { UsersDeviceRepository } from '../../../users/repositories/users-device.repository';
import { UserDeviceEntity } from '../../../users/entities/user-device.entity';
import typia from 'typia';
import { MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';
import {
  NOTIFICATION_TYPES,
  NotificationDataMap,
  NotificationType,
} from '../../../notifications/types/notification.type';

describe('FcmService [unit]', () => {
  let fcmService: FcmService;
  let firebaseMock: MockProxy<app.App>;
  let usersDeviceRepository: MockProxy<UsersDeviceRepository>;

  beforeEach(async () => {
    firebaseMock = mock<app.App>();
    usersDeviceRepository = mock<UsersDeviceRepository>();

    const module = await Test.createTestingModule({
      providers: [
        FcmService,
        {
          provide: 'FCM_ADMIN',
          useValue: firebaseMock,
        },
        {
          provide: UsersDeviceRepository,
          useValue: usersDeviceRepository,
        },
      ],
    }).compile();

    fcmService = module.get(FcmService);
  });

  it('should be definded', () => {
    expect(fcmService).toBeDefined();
  });

  describe('sendNotificationToDevice', () => {
    it('should send FCM with correct targetPrice payload', async () => {
      // Arrange
      const userIdx = 1;
      const mockTokens = ['token_1', 'token_2'];
      usersDeviceRepository.findTokensByUser.mockResolvedValue(
        mockTokens.map((e) => ({ deviceToken: e })) as UserDeviceEntity[],
      );
      const notificationPayload = {
        notificationType: NOTIFICATION_TYPES.TARGET_PRICE,
        notification: {
          title: 'targetPrice notification title',
          body: 'targetPrice notification body',
        },
        data: {
          baseCurrency: 'KRW',
          currencyCode: 'EUR',
          targetPrice: 1500,
        },
      };

      // Act
      const sendEachMock = jest.fn().mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        responses: [],
      });

      (firebaseMock.messaging as () => messaging.Messaging) = () =>
        ({ sendEachForMulticast: sendEachMock }) as any;

      // Assert
      await fcmService.sendNotificationToDevice<'TARGET_PRICE'>(userIdx, {
        data: notificationPayload.data,
        notification: notificationPayload.notification,
        notificationType: notificationPayload.notificationType,
      });

      expect(sendEachMock).toHaveBeenCalledWith({
        data: {
          type: notificationPayload.notificationType,
          payload: JSON.stringify(notificationPayload.data),
        },
        notification: {
          ...notificationPayload.notification,
        },
        tokens: mockTokens,
      });
    });

    it.todo('should log if tokens are not exist');
    it.todo('should log warnings for failed tokens');
    it.todo('should throw error if firebase throws');
  });
});
