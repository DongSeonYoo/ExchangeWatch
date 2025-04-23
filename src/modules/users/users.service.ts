import { Injectable, Logger } from '@nestjs/common';
import { IUser } from './interfaces/user.interface';
import { UserEntity } from './entities/user.entity';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  private readonly logger: Logger = new Logger(UsersService.name);
  constructor(private readonly usersRepository: UsersRepository) {}

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
}
