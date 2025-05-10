import { Injectable } from '@nestjs/common';
import { IUser } from './interfaces/user.interface';
import { UserEntity } from './entities/user.entity';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { UsersRepository } from './repositories/users.repository';
import { UsersDeviceRepository } from './repositories/users-device.repository';
import { IUserDevice } from './interfaces/user-device.interface';
import { Transactional } from '@nestjs-cls/transactional';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersDeviceRepository: UsersDeviceRepository,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.context = UsersService.name;
  }

  async findUserByIdx(userIdx: number): Promise<UserEntity> {
    const existUser = await this.usersRepository.findUserByIdx(userIdx);
    if (!existUser) {
      throw new UserNotFoundException();
    }

    return existUser;
  }

  async handleSocialLogin(input: IUser.ICreateBySocial): Promise<UserEntity> {
    const user = await this.usersRepository.findUserBySocialId(
      input.socialId,
      input.socialProvider,
    );

    if (user) {
      return user;
    }

    return await this.usersRepository.createUser(input);
  }

  /**
   * 사용자 디바이스 등록
   *
   * 등록시
   * - userIdx + deviceToken조합이 이미 있으면 -> 갱신
   * - 다른 유저가 해당 토큰을 이미 등록해놨으면 -> 삭제 후 새 유저에게 등록
   */
  @Transactional()
  async registerUserDevice(input: IUserDevice.ICreate): Promise<void> {
    // 해당 토큰이 이미 존재하는지 확인
    const existing = await this.usersDeviceRepository.findTokenByDeviceToken(
      input.deviceToken,
    );

    // 만약 다른 유저가 이 토큰을 가지고 있다면? 삭제
    if (existing && existing.userIdx !== input.userIdx) {
      await this.usersDeviceRepository.deleteDeviceToken(
        existing.userIdx,
        existing.deviceToken,
      );
    }

    // 디바이스 토큰 생성
    await this.usersDeviceRepository.upsertDeviceToken({
      userIdx: input.userIdx,
      deviceToken: input.deviceToken,
      deviceType: input.deviceType,
    });
  }

  /**
   * 해당 유저의 등록된 디바이스 토큰을 삭제
   */
  async deleteUserDevice(userIdx: number, deviceToken: string): Promise<void> {
    const checkHasToken = await this.usersDeviceRepository.findTokenByUser(
      userIdx,
      deviceToken,
    );
    if (!checkHasToken) {
      this.logger.verbose(
        `No device token found for user ${userIdx} and token ${deviceToken}`,
      );
      return;
    }

    await this.usersDeviceRepository.deleteDeviceToken(userIdx, deviceToken);

    return;
  }
}
