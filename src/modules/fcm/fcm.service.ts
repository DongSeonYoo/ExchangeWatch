import { Inject, Injectable, Logger } from '@nestjs/common';
import { app, messaging } from 'firebase-admin';
import {
  NotificationDataMap,
  NotificationType,
} from '../notifications/types/notification.type';
import { IFcmNotification } from './interfaces/fcm.interface';
import { UsersRepository } from '../users/repositories/users.repository';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(
    @Inject('FCM_ADMIN') private readonly firebaseApp: app.App,
    private readonly userService: UsersRepository,
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
    const userDeviceTokens = await this.getUserDeviceTokens(userIdx);
    const message: messaging.MulticastMessage = {
      tokens: userDeviceTokens,
      notification: args.notification,
      data: args.data as any,
    };

    const response = await this.firebaseApp
      .messaging()
      .sendEachForMulticast(message);

    // 4. 로그
    this.logger.debug(
      `FCM sent to ${userDeviceTokens.length} devices. Success: ${response.successCount}, Failure: ${response.failureCount}`,
    );
  }
  /**
   * 테스트용 유저 디바이스 토큰 조회 (임시)
   */
  private async getUserDeviceTokens(userIdx: number): Promise<string[]> {
    // @TODO: DB에서 user-device 테이블 조회로 대체
    return ['TEST_DEVICE_TOKEN_1', 'TEST_DEVICE_TOKEN_2'];
  }
}
