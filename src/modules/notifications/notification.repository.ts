import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { INotification } from './types/notification.interface';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationType } from './types/notification.type';

@Injectable()
export class NotificationRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  async getUserNotificationsCount(userIdx: number): Promise<number> {
    const count = await this.txHost.tx.notifications.count({
      where: {
        userIdx,
      },
    });

    return count;
  }

  async getUserNotifications<T extends NotificationType>(
    input: INotification.ISelect<T>,
  ): Promise<NotificationEntity<T>[]> {
    const targetPrice = await this.txHost.tx.notifications.findMany({
      where: {
        notificationType: input.notificationType,
        userIdx: input.userIdx,
      },
    });

    return targetPrice.map(NotificationEntity.from<T>);
  }

  async createNotification<T extends NotificationType>(
    input: INotification.ICreate<T>,
  ): Promise<NotificationEntity<T>> {
    const result = await this.txHost.tx.notifications.create({
      data: {
        userIdx: input.userIdx,
        notificationType: input.notificationType,
        notificationData: input.notificationData,
      },
    });

    return NotificationEntity.from(result);
  }

  async getNotificationsWithOffset<T extends NotificationType>(
    input: INotification.ISelectWithOffset<T>,
  ): Promise<NotificationEntity<T>[]> {
    const result = await this.txHost.tx.notifications.findMany({
      where: {
        userIdx: input.userIdx,
        isActive: true,
        notificationType: input.notificationType,
      },
      take: input.limit,
      skip: input.offset,
    });

    return result.map(NotificationEntity.from<T>);
  }
}
