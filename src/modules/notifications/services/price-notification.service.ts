import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../notification.repository';
import { CreatePriceNotificationReqDto } from '../dtos/price-notification/create-price-notification.dto';
import { NotificationEntity } from '../entities/notification.entity';
import { MaxNotificationCountException } from '../exceptions/max-notification-count.exception';
import { AlreadyRegisterNotificationException } from '../exceptions/arleady-notification.exception';
import { SelectPriceNotificationReqDto } from '../dtos/price-notification/select-price-notification.dto';

@Injectable()
export class PriceNotificationService {
  private readonly MAX_NOTIFICATION_COUNT = 10;
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async createPriceNotification(
    input: CreatePriceNotificationReqDto,
    userIdx: number,
  ): Promise<NotificationEntity<'TARGET_PRICE'>> {
    const notiCount =
      await this.notificationRepository.getUserNotificationsCount(userIdx);
    if (notiCount >= this.MAX_NOTIFICATION_COUNT) {
      throw new MaxNotificationCountException();
    }

    const result = await this.notificationRepository.getUserNotifications({
      notificationType: 'TARGET_PRICE',
      userIdx: userIdx,
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
      await this.notificationRepository.createNotification({
        notificationType: 'TARGET_PRICE',
        notificationData: input,
        userIdx: userIdx,
      });

    return createdNotification;
  }

  async getPriceNotificationList(
    input: SelectPriceNotificationReqDto,
    userIdx: number,
  ): Promise<{
    items: NotificationEntity[];
    limit: number;
    offset: number;
  }> {
    const result = await this.notificationRepository.getNotificationsWithOffset(
      {
        userIdx: userIdx,
        limit: input.limit,
        offset: input.getOffset(),
        notificationType: 'TARGET_PRICE',
      },
    );

    return {
      items: result,
      limit: input.limit,
      offset: input.getOffset(),
    };
  }
}
