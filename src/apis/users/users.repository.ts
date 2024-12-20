import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';
import { Prisma } from '@prisma/client';
import { BaseOffsetDto } from '../../dtos/pagination/base-offset.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 이메일 중복 체크
   *
   * - 이메일이 중복되지 않을 시, UserEntity를 생성하여 반환한다
   * - 이메일이 중복되면 null을 반환한다
   * - tx가 주어지면 해당 트랜잭션 내에서 실행한다
   */
  async checkDuplicateEmail(
    email: UserEntity['email'],
    tx?: Prisma.TransactionClient,
  ): Promise<UserEntity | null> {
    const checkEmail = await (tx ?? this.prismaService).user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
    });

    return checkEmail ? UserEntity.from(checkEmail) : null;
  }

  /**
   * 유저 생성
   *
   * - 유저를 생성하고 생성된 유저를 반환한다
   * - tx가 주어지면 해당 트랜잭션 내에서 실행한다
   */
  async createUser(
    user: UserEntity,
    tx?: Prisma.TransactionClient,
  ): Promise<UserEntity> {
    const createdUser = await (tx ?? this.prismaService).user.create({
      data: {
        ...user,
      },
    });

    return UserEntity.from(createdUser);
  }

  /**
   * 유저 업데이트
   *
   * - 유저를 업데이트하고 업데이트된 유저를 반환한다
   * - tx가 주어지면 해당 트랜잭션 내에서 실행한다
   */
  async updateUser(
    userIdx: UserEntity['idx'],
    updateUserInfo: Partial<UserEntity>,
    tx?: Prisma.TransactionClient,
  ): Promise<UserEntity> {
    const updatedUser = await (tx ?? this.prismaService).user.update({
      data: {
        name: updateUserInfo.name,
        email: updateUserInfo.email,
        password: updateUserInfo.password,
      },
      where: {
        idx: userIdx,
        deletedAt: null,
      },
    });

    return UserEntity.from(updatedUser);
  }

  /**
   * 유저 인덱스로 유저 조회
   *
   * - 유저 인덱스로 유저를 조회하고 해당하는 유저를 반환한다
   * - 유저가 존재하지 않을 경우 null을 반환한다
   */
  async findUserByIdx(
    userIdx: UserEntity['idx'],
    tx?: Prisma.TransactionClient,
  ): Promise<UserEntity | null> {
    const user = await (tx ?? this.prismaService).user.findUnique({
      where: {
        idx: userIdx,
        deletedAt: null,
      },
    });

    return user ? UserEntity.from(user) : null;
  }

  async getUsersList(args: BaseOffsetDto) {
    const [users, total] = await Promise.all([
      this.prismaService.user.findMany({
        skip: args.getSkip(),
        take: args.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.user.count(),
    ]);

    return { users, total };
  }
}
