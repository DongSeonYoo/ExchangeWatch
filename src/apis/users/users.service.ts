import { Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { IUser } from './interfaces/user.interface';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger: Logger = new Logger(UsersService.name);
  constructor(private readonly usersRepository: UsersRepository) {}

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
