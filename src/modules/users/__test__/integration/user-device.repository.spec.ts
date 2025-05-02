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

  afterEach(async () => {
    await prisma.userDevices.deleteMany();
  });

  it('should be defined', () => {
    expect(usersDeviceRepository).toBeDefined();
  });

  describe('findTokensByUser', () => {
    it('should return tokens by user idx', async () => {
      // Arrange
      const deviceToken = ['user_1_device_token1', 'user_1_device_token2'];
      await prisma.userDevices.createMany({
        data: [
          {
            userIdx: 1,
            deviceToken: deviceToken[0],
            deviceType: 'ios',
          },
          {
            userIdx: 1,
            deviceToken: deviceToken[1],
            deviceType: 'android',
          },
        ],
      });

      // Act
      const act = await usersDeviceRepository.findTokensByUser(userIdx);

      // Assert
      expect(() => typia.assertEquals<UserDeviceEntity[]>(act)).not.toThrow();
      expect(act.map((e) => e.deviceToken)).toEqual(deviceToken);
    });

    it('should return empty tokens when user does not have any token', async () => {
      // Act
      const act = await usersDeviceRepository.findTokensByUser(userIdx);

      // Assert
      expect(() => typia.assertEquals<UserDeviceEntity[]>(act)).not.toThrow();
      expect(act).toEqual([]);
    });
  });

  describe('findTokenByUser', () => {
    it('should return a device token associated with the given user', async () => {
      // Arrange
      const deviceToken = 'device_token_by_user_1';
      await prisma.userDevices.create({
        data: {
          userIdx,
          deviceToken,
          deviceType: 'android',
        },
      });

      // Act
      const result = await usersDeviceRepository.findTokenByUser(
        userIdx,
        deviceToken,
      );

      // Assert
      expect(() => typia.assertEquals<UserDeviceEntity>(result)).not.toThrow();
    });

    it('should not return a device token when token does not exist', async () => {
      // Act
      const result = await usersDeviceRepository.findTokenByUser(
        userIdx,
        'fake_device_token',
      );

      // Assert
      expect(result).toBeNull();
    });
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

      // Assert
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
      // Arrange
      await usersDeviceRepository.deleteDeviceToken(userIdx, deviceToken);

      // Act
      const act =
        await usersDeviceRepository.findTokenByDeviceToken(deviceToken);

      // Assert
      expect(act).toBeNull();
    });
  });

  describe('upsertDeviceToken', () => {
    const deviceToken = 'token_upsert_test';

    it('should create a new token if it does not exist', async () => {
      // Arrange
      await usersDeviceRepository.upsertDeviceToken({
        userIdx,
        deviceToken,
        deviceType: 'android',
      });

      // Act
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

      await usersDeviceRepository.upsertDeviceToken({
        userIdx,
        deviceToken,
        deviceType: 'ios',
      });

      // Act
      const act =
        await usersDeviceRepository.findTokenByDeviceToken(deviceToken);

      // Assert
      expect(act!.deviceType).toBe('ios');
      expect(act!.deviceToken).toBe('token_upsert_test');
    });
  });
});
