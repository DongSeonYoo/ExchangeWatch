import { Inject, Injectable, Logger } from '@nestjs/common';
import { app, FirebaseError, messaging } from 'firebase-admin';
import { NotificationType } from '../notifications/types/notification.type';
import { IFcmNotification } from './interfaces/fcm.interface';
import { UsersDeviceRepository } from '../users/repositories/users-device.repository';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';

@Injectable()
export class FcmService {
  constructor(
    @Inject('FCM_ADMIN') private readonly firebaseApp: app.App,
    private readonly usersDeviceRepository: UsersDeviceRepository,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.context = FcmService.name;
  }

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
      this.logger.info(
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

    try {
      const response = await this.firebaseApp
        .messaging()
        .sendEachForMulticast(message);

      response.responses.forEach((result) => {
        if (!result.success) {
          const fcmError = result.error as FirebaseError;
          this.logger.error(
            `발송 실패. userIdx: ${userIdx}, type: ${args.notificationType}, [${fcmError.code}]: ${fcmError.message}`,
            fcmError.stack,
          );
        } else {
          this.logger.verbose(
            `메시지 발송 성공. userIdx: ${userIdx}, type: ${args.notificationType}`,
          );
        }
      });
    } catch (error) {
      const err = error as FirebaseError;
      this.logger.error(
        `메시지 전체 발송 실패, userIdx: 1, Error: ${err.message}, code: ${err.code}`,
        err.stack,
      );
    }
  }
}
