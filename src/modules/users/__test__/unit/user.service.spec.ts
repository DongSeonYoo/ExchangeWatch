import { Test } from '@nestjs/testing';
import { UsersService } from '../../users.service';
import { mock, MockProxy } from 'jest-mock-extended';
import { UsersRepository } from '../../repositories/users.repository';
import { UsersDeviceRepository } from '../../repositories/users-device.repository';
import { UserDeviceEntity } from '../../entities/user-device.entity';
import { Logger } from '@nestjs/common';

describe('UserService [unit]', () => {
  let usersService: UsersService;
  let usersRepository: MockProxy<UsersRepository>;
  let usersDeviceRepository: MockProxy<UsersDeviceRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mock(UsersRepository),
        },
        {
          provide: UsersDeviceRepository,
          useValue: mock(UsersDeviceRepository),
        },
      ],
    }).compile();

    usersService = module.get(UsersService);
    usersRepository = module.get(UsersRepository);
    usersDeviceRepository = module.get(UsersDeviceRepository);
  });

  it('should be definded', () => {
    expect(usersRepository).toBeDefined();
    expect(usersDeviceRepository).toBeDefined();
  });

  describe('registerUserDevice', () => {
    const userIdx = 1;
    const deviceToken = 'deviceToken123';
    const deviceType = 'ios';
    let createDeviceTokenSpy: jest.SpyInstance;
    let deleteDeviceTokenSpy: jest.SpyInstance;

    beforeEach(() => {
      createDeviceTokenSpy = jest.spyOn(
        usersDeviceRepository,
        'upsertDeviceToken',
      );
      deleteDeviceTokenSpy = jest.spyOn(
        usersDeviceRepository,
        'deleteDeviceToken',
      );
    });

    it('should register user"s fcm token', async () => {
      // Arrange
      const createDeviceTokenSpy = jest.spyOn(
        usersDeviceRepository,
        'upsertDeviceToken',
      );
      usersDeviceRepository.findTokenByDeviceToken.mockResolvedValue({
        userIdx,
      } as any);

      // Act
      await usersService.registerUserDevice({
        userIdx,
        deviceType,
        deviceToken,
      });

      // Assert
      expect(deleteDeviceTokenSpy).not.toHaveBeenCalled();
      expect(createDeviceTokenSpy).toHaveBeenCalledWith({
        userIdx,
        deviceToken,
        deviceType,
      });
    });

    it('should remove token if already registerd by another user', async () => {
      // Arrange
      usersDeviceRepository.findTokenByDeviceToken.mockResolvedValue({
        userIdx: 12,
        deviceToken,
      } as any);

      // Act
      await usersService.registerUserDevice({
        userIdx,
        deviceType,
        deviceToken,
      });

      // Assert
      expect(deleteDeviceTokenSpy).toHaveBeenCalledWith(12, deviceToken);
      expect(createDeviceTokenSpy).toHaveBeenCalledWith({
        userIdx,
        deviceToken,
        deviceType,
      });
    });
  });

  describe('deleteUserDevice', () => {
    const userIdx = 1;
    const deviceToken = 'device_token_by_user_1';

    it('should log a warning if token does not exist', async () => {
      // Arrange
      usersDeviceRepository.findTokenByUser.mockResolvedValue(null);
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');
      const deleteTokenSpy = jest.spyOn(
        usersDeviceRepository,
        'deleteDeviceToken',
      );

      // Act
      await usersService.deleteUserDevice(userIdx, deviceToken);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        `No device token found for user ${userIdx} and token ${deviceToken}`,
      );
      expect(deleteTokenSpy).not.toHaveBeenCalledWith(userIdx, deviceToken);
    });

    it('should call deleteDeviceToken when token exists', async () => {
      // Arrange
      const deleteTokenSpy = jest.spyOn(
        usersDeviceRepository,
        'deleteDeviceToken',
      );
      usersDeviceRepository.findTokenByUser.mockResolvedValue(
        {} as UserDeviceEntity,
      );

      // Act
      await usersService.deleteUserDevice(userIdx, deviceToken);

      // Assert
      expect(deleteTokenSpy).toHaveBeenCalledWith(userIdx, deviceToken);
    });
  });
});
