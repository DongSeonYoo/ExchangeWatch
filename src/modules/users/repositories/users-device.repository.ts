import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import { UserDeviceEntity } from '../entities/user-device.entity';
import { IUserDevice } from '../interfaces/user-device.interface';

@Injectable()
export class UsersDeviceRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  async findTokenByUser(
    userIdx: number,
    deviceToken: string,
  ): Promise<UserDeviceEntity | null> {
    return await this.txHost.tx.userDevices
      .findUnique({
        where: {
          userIdx_deviceToken: {
            userIdx,
            deviceToken,
          },
          Users: {
            deletedAt: null,
          },
        },
      })
      .then((result) => (result ? UserDeviceEntity.from(result) : null));
  }

  async findTokenByDeviceToken(
    deviceToken: string,
  ): Promise<UserDeviceEntity | null> {
    return await this.txHost.tx.userDevices
      .findFirst({
        where: {
          deviceToken,
        },
      })
      .then((result) => (result ? UserDeviceEntity.from(result) : null));
  }

  async deleteDeviceToken(userIdx: number, deviceToken: string): Promise<void> {
    await this.txHost.tx.userDevices.delete({
      where: {
        userIdx_deviceToken: {
          userIdx,
          deviceToken,
        },
        Users: {
          deletedAt: null,
        },
      },
    });
  }

  async upsertDeviceToken(input: IUserDevice.ICreate): Promise<void> {
    await this.txHost.tx.userDevices.upsert({
      where: {
        userIdx_deviceToken: {
          userIdx: input.userIdx,
          deviceToken: input.deviceToken,
        },
      },
      update: {
        userIdx: input.userIdx,
        deviceType: input.deviceType,
        deviceToken: input.deviceToken,
      },
      create: {
        userIdx: input.userIdx,
        deviceType: input.deviceType,
        deviceToken: input.deviceToken,
      },
    });
  }
}
