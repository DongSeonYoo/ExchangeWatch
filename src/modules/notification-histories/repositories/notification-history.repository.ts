import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import {
  NotificationDataMap,
  NotificationType,
} from '../../notifications/types/notification.type';

@Injectable()
export class NotificationHistoryRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  async createNotificationHistory<T extends NotificationType>(
    userIdx: number,
    notificationIdx: string,
    notificationData: NotificationDataMap[T],
  ) {
    const result = await this.txHost.tx.notificationsHistories.create({
      data: {
        notificationIdx,
        userIdx,
        details: notificationData,
      },
    });
  }
}
