import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IUser } from './interfaces/user.interface';
import { UserEntity } from './entities/user.entity';
import { SocialProvider } from '../auth/constant/auth.contant';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(input: IUser.ICreateBySocial): Promise<UserEntity> {
    const createdUser = await this.prisma.users.create({
      data: {
        email: input.email,
        name: input.name,
        password: input.password,
        socialProvider: input.socialProvider,
        socialId: input.socialId,
      },
    });

    return UserEntity.from(createdUser);
  }

  async findUserByIdx(userIdx: number): Promise<UserEntity | null> {
    const foundUser = await this.prisma.users.findFirst({
      where: {
        idx: userIdx,
      },
    });

    return foundUser ? UserEntity.from(foundUser) : null;
  }

  async findUserBySocialId(
    socialId: string,
    socialProvider: SocialProvider,
  ): Promise<UserEntity | null> {
    const foundUser = await this.prisma.users.findFirst({
      where: {
        socialProvider: socialProvider,
        socialId: socialId,
      },
    });

    return foundUser ? UserEntity.from(foundUser) : null;
  }
}
