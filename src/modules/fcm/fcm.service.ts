import { Inject, Injectable, Logger } from '@nestjs/common';
import { app, messaging } from 'firebase-admin';
import { NotificationType } from '../notifications/types/notification.type';
import { IFcmNotification } from './interfaces/fcm.interface';
import { UsersDeviceRepository } from '../users/repositories/users-device.repository';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(
    @Inject('FCM_ADMIN') private readonly firebaseApp: app.App,
    private readonly usersDeviceRepository: UsersDeviceRepository,
  ) {}

  /**
   * FCM 디바이스 전송
   *
   * @param userIdx
   */
  async sendNotificationToDevice<T extends NotificationType>(
    userIdx: number,
    args: IFcmNotification.ICreate<T>,
  ) {
    const userDeviceTokens =
      await this.usersDeviceRepository.findTokensByUser(userIdx);
    if (userDeviceTokens.length === 0) {
      this.logger.log(
        `해당하는 사용자의 디바이스 토큰이 존재하지 않습니다: user: ${userIdx}`,
      );
      return;
    }

    const message: messaging.MulticastMessage = {
      tokens: userDeviceTokens.map((e) => e.deviceToken),
      notification: {
        title: args.notification.title,
        body: args.notification.body,
      },
      data: {
        type: args.notificationType,
        payload: JSON.stringify(args.data),
      },
    };

    const response = await this.firebaseApp
      .messaging()
      .sendEachForMulticast(message);

    // 4. 로그
    this.logger.debug(
      `FCM sent to ${userDeviceTokens.length} devices. Success: ${response.successCount}, Failure: ${response.failureCount}`,
    );
  }
}
