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
  ) {
    const targetPrice = await this.txHost.tx.notifications.findMany({
      where: {
        notificationType: input.notificationType,
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
}
