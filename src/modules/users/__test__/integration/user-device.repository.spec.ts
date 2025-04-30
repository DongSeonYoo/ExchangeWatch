import { Test } from '@nestjs/testing';
import { TEST_PRISMA_TOKEN } from '../../../../../test/integration/modules/test-prisma.module';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';
import { UsersDeviceRepository } from '../../repositories/users-device.repository';
import { PrismaClient } from '@prisma/client';
import typia from 'typia';
import { UserDeviceEntity } from '../../entities/user-device.entity';

describe('usersDeviceRepository (integrate)', () => {
  const userIdx = 1;
  let usersDeviceRepository: UsersDeviceRepository;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [UsersDeviceRepository],
    }).compile();

    usersDeviceRepository = app.get(UsersDeviceRepository);
    prisma = app.get(TEST_PRISMA_TOKEN);
  });

  it('should definded', () => {
    expect(usersDeviceRepository).toBeDefined();
  });
  describe('findTokenByDeviceToken', () => {
    const deviceToken = 'device_token_by_user_1';

    beforeEach(async () => {
      await prisma.userDevices.create({
        data: {
          userIdx: userIdx,
          deviceToken: deviceToken,
          deviceType: 'android',
        },
      });
    });

    afterEach(async () => {
      await prisma.userDevices.deleteMany({
        where: { deviceToken: deviceToken },
      });
    });

    it('should return a device token registered by the user', async () => {
      // Act
      const act =
        await usersDeviceRepository.findTokenByDeviceToken(deviceToken);

      // Assert
      expect(() => typia.assertEquals<UserDeviceEntity>(act)).not.toThrow();
    });

    it('should return null if token does not exist', async () => {
      // Act
      const act =
        await usersDeviceRepository.findTokenByDeviceToken(
          'non_existing_token',
        );

      //   Assert
      expect(() => typia.assertEquals<UserDeviceEntity>(act)).toThrow();
      expect(act).toBeNull();
    });
  });

  describe('deleteDeviceToken', () => {
    const deviceToken = 'token_to_delete';

    beforeEach(async () => {
      await prisma.userDevices.create({
        data: {
          userIdx,
          deviceToken,
          deviceType: 'ios',
        },
      });
    });

    it('should delete a token registered by the user', async () => {
      // Act
      await usersDeviceRepository.deleteDeviceToken(userIdx, deviceToken);
      const act =
        await usersDeviceRepository.findTokenByDeviceToken(deviceToken);

      // Assert
      expect(act).toBeNull();
    });
  });

  describe('upsertDeviceToken', () => {
    const deviceToken = 'token_upsert_test';

    beforeEach(async () => {
      await prisma.userDevices.deleteMany({ where: { deviceToken } });
    });

    it('should create a new token if it does not exist', async () => {
      // Act
      await usersDeviceRepository.upsertDeviceToken({
        userIdx,
        deviceToken,
        deviceType: 'android',
      });
      const act =
        await usersDeviceRepository.findTokenByDeviceToken(deviceToken);

      // Assert
      expect(() => typia.assertEquals<UserDeviceEntity>(act)).not.toThrow();
      expect(act).not.toBeNull();
    });

    it('should update the token if it already exists', async () => {
      // Arrange
      await prisma.userDevices.create({
        data: {
          userIdx,
          deviceToken,
          deviceType: 'android',
        },
      });

      // Act
      await usersDeviceRepository.upsertDeviceToken({
        userIdx,
        deviceToken,
        deviceType: 'ios',
      });
      const act =
        await usersDeviceRepository.findTokenByDeviceToken(deviceToken);

      // Assert
      expect(act!.deviceType).toBe('ios');
      expect(act!.deviceToken).toBe('token_upsert_test');
    });
  });
});
