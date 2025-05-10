import { Test } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { app, FirebaseError } from 'firebase-admin';
import { FcmService } from '../../fcm.service';
import { UsersDeviceRepository } from '../../../users/repositories/users-device.repository';
import { UserDeviceEntity } from '../../../users/entities/user-device.entity';
import { CustomLoggerService } from '../../../../common/logger/custom-logger.service';
import { IFcmNotification } from '../../interfaces/fcm.interface';

const createMockFirebaseError = (
  message: string,
  code: string,
  stack?: string,
): FirebaseError => {
  const error = new Error(message) as unknown as FirebaseError;
  error.code = code;
  error.stack = stack || new Error(message).stack;
  return error;
};

describe('FcmService [unit]', () => {
  let fcmService: FcmService;
  let firebaseAppMock: MockProxy<app.App>;
  let usersDeviceRepositoryMock: MockProxy<UsersDeviceRepository>;
  let loggerServiceMock: MockProxy<CustomLoggerService>;
  let sendEachForMulticastMock: jest.Mock;

  beforeEach(async () => {
    firebaseAppMock = mock<app.App>();
    usersDeviceRepositoryMock = mock<UsersDeviceRepository>();
    loggerServiceMock = mock<CustomLoggerService>();

    sendEachForMulticastMock = jest.fn();
    (firebaseAppMock.messaging as jest.Mock).mockImplementation(() => ({
      sendEachForMulticast: sendEachForMulticastMock,
    }));

    const module = await Test.createTestingModule({
      providers: [
        FcmService,
        {
          provide: CustomLoggerService,
          useValue: loggerServiceMock,
        },
        {
          provide: 'FCM_ADMIN',
          useValue: firebaseAppMock,
        },
        {
          provide: UsersDeviceRepository,
          useValue: usersDeviceRepositoryMock,
        },
      ],
    }).compile();

    fcmService = module.get(FcmService);
  });

  it('should be defined', () => {
    expect(fcmService).toBeDefined();
  });

  describe('sendNotificationToDevice [TARGET_PRICE]', () => {
    const defaultNotificationPayload: IFcmNotification.ICreate<'TARGET_PRICE'> =
      {
        notificationType: 'TARGET_PRICE',
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

    it('정상적인 페이로드로 FCM 메시지를 전송해야 한다', async () => {
      // Arrange
      const userIdx = 1;
      const mockTokens = ['token_1', 'token_2'];
      usersDeviceRepositoryMock.findTokensByUser.mockResolvedValue(
        mockTokens.map((e) => ({ deviceToken: e }) as UserDeviceEntity),
      );
      sendEachForMulticastMock.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        responses: [
          { success: true, messageId: 'idx1' },
          { success: true, messageId: 'idx2' },
        ],
      });

      // Act
      await fcmService.sendNotificationToDevice(
        userIdx,
        defaultNotificationPayload,
      );

      // Assert
      expect(sendEachForMulticastMock).toHaveBeenCalledWith({
        data: {
          type: defaultNotificationPayload.notificationType,
          payload: JSON.stringify(defaultNotificationPayload.data),
        },
        notification: {
          ...defaultNotificationPayload.notification,
        },
        tokens: mockTokens,
      });

      expect(loggerServiceMock.verbose).toHaveBeenCalledWith(
        `메시지 발송 성공. userIdx: ${userIdx}, type: TARGET_PRICE`,
      );
    });

    it('만약 디바이스 토큰이 없을 경우 경고 로그를 남겨야 한다', async () => {
      // Arrange
      const userIdx = 1;
      usersDeviceRepositoryMock.findTokensByUser.mockResolvedValue([]);

      // Act
      await fcmService.sendNotificationToDevice(
        userIdx,
        defaultNotificationPayload,
      );

      // Assert
      expect(sendEachForMulticastMock).not.toHaveBeenCalled();
      expect(loggerServiceMock.log).toHaveBeenCalledWith(
        `해당하는 사용자의 디바이스 토큰이 존재하지 않습니다: user: ${userIdx}`,
      );
    });

    it('일부 토큰 발송 실패 시, 실패 건에 대해 에러 로그를 남긴다.', async () => {
      // Arrange
      const userIdx = 1;
      const mockTokens = ['token_1'];
      usersDeviceRepositoryMock.findTokensByUser.mockResolvedValue(
        mockTokens.map((e) => ({ deviceToken: e }) as UserDeviceEntity),
      );
      sendEachForMulticastMock.mockResolvedValue({
        successCount: 1,
        failureCount: 1,
        responses: [
          {
            success: false,
            messageId: 'idx1',
            error: {
              code: 'firebaseErrorCode',
              message: 'firebaseErrorMessage',
              stack: 'firebaseErrorStack',
            },
          },
          { success: true, messageId: 'idx2' },
        ],
      });

      // Act
      await fcmService.sendNotificationToDevice(
        userIdx,
        defaultNotificationPayload,
      );

      // Assert
      expect(loggerServiceMock.error).toHaveBeenCalledWith(
        `발송 실패. userIdx: ${userIdx}, type: TARGET_PRICE, [firebaseErrorCode]: firebaseErrorMessage`,
        'firebaseErrorStack',
      );
    });

    it('sendEachForMulticast API 호출 자체가 실패할 경우 에러 로그를 남겨야 한다', async () => {
      // Arrange
      const userIdx = 1;
      const mockTokens = ['token_1'];
      usersDeviceRepositoryMock.findTokensByUser.mockResolvedValue(
        mockTokens.map((e) => ({ deviceToken: e }) as UserDeviceEntity),
      );

      const globalError = createMockFirebaseError(
        'Global Firebase API error',
        'UNAVAILABLE',
        'globalStackTrace',
      );
      sendEachForMulticastMock.mockRejectedValue(globalError); // 여기도 변경

      // Act
      await fcmService.sendNotificationToDevice(
        userIdx,
        defaultNotificationPayload,
      );

      // Assert
      expect(loggerServiceMock.error).toHaveBeenCalledWith(
        `메시지 전체 발송 실패, userIdx: 1, Error: ${globalError.message}, code: ${globalError.code}`,
        globalError.stack,
      );
    });
  });
});
