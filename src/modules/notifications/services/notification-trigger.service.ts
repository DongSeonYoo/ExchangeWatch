import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../notification.repository';
import { NotificationHistoryRepository } from '../../notification-histories/repositories/notification-history.repository';
import { FcmService } from '../../fcm/fcm.service';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class NotificationTriggerService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationHistoryRepository: NotificationHistoryRepository,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * 알림 조건 판단 [TARGET_PRICE]
   * 1. 발생된 이벤트의 해당하는 통화쌍의 notifications 조회
   *  1-2. 트리거 조건 만족 시 (targetPrice <= latestRate)
   *    - notification_histories에 알림 기록 삽입
   *    - FcmService 호출
   *
   *  1-3. 트리거 조건을 만족하지 않을 시 (targerPrice > latestRate)
   *    - 무시
   *
   * @todo 여기도 캐싱 고려
   * @param payload
   */
  @Transactional()
  async handleTargetPriceTrigger(
    baseCurrency: string,
    currencyCode: string,
    latestRate: number,
  ) {
    // 1. 해당 통화쌍에 등록된 모든 targetprice 알림 가져오기
    const priceNotifications =
      await this.notificationRepository.getTargetPriceNotificationByPair(
        baseCurrency,
        currencyCode,
      );

    await Promise.all(
      priceNotifications
        .filter((notification) => notification !== null)
        .map(async (notification) => {
          const userIdx = notification.userIdx;

          // 조건 만족 시
          if (notification.notificationData.targetPrice <= latestRate) {
            // 1. 알림 기록 저장
            await this.notificationHistoryRepository.createNotificationHistory<'TARGET_PRICE'>(
              userIdx,
              notification.idx,
              notification.notificationData,
            );

            // 2. FCM 전송
            await this.fcmService.sendNotificationToDevice<'TARGET_PRICE'>(
              userIdx,
              {
                notificationType: 'TARGET_PRICE',
                notification: {
                  title: '환율 알림',
                  body: `${currencyCode}가 목표가[${latestRate}]에 도달했습니다`,
                },
                data: {
                  baseCurrency,
                  currencyCode,
                  targetPrice: latestRate,
                },
              },
            );
          }
        }),
    );
  }
}
