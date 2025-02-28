import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { CreatePriceNotificationReqDto } from './dtos/price-notification/create-price-notification.dto';
import { NotificationEntity } from './entities/notification.entity';
import { MaxNotificationCountException } from './exceptions/max-notification-count.exception';
import { AlreadyRegisterNotificationException } from './exceptions/arleady-notification.exception';

@Injectable()
export class NotificationService {
  private readonly MAX_NOTIFICATION_COUNT = 10;
  constructor(
    private readonly priceNotificationRepository: NotificationRepository,
  ) {}

  async createPriceNotification(
    input: CreatePriceNotificationReqDto,
    userIdx: number,
  ): Promise<NotificationEntity<'TARGET_PRICE'>> {
    const notiCount =
      await this.priceNotificationRepository.getUserNotificationsCount(userIdx);
    if (notiCount >= this.MAX_NOTIFICATION_COUNT) {
      throw new MaxNotificationCountException();
    }

    const result = await this.priceNotificationRepository.getUserNotifications({
      notificationType: 'TARGET_PRICE',
      notificationData: input,
    });
    const check = result.some((notification) => {
      const data = notification.notificationData;
      return (
        input.baseCurrency === data.baseCurrency &&
        input.currencyCode === data.currencyCode &&
        input.targetPrice === data.targetPrice
      );
    });
    if (check) {
      throw new AlreadyRegisterNotificationException();
    }

    const createdNotification =
      await this.priceNotificationRepository.createNotification({
        notificationType: 'TARGET_PRICE',
        notificationData: input,
        userIdx: userIdx,
      });

    return createdNotification;
  }
}
