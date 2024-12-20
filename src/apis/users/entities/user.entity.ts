import Prisma from '@prisma/client';

export class UserEntity {
  /**
   * 유저 인덱스
   *
   * @example 1
   */
  idx: number;

  /**
   * 이메일
   *
   * @example email1@naver.com
   */
  email: string;

  /**
   * 비밀번호
   *
   * @example password1
   */
  password: string;

  /**
   * 이름
   *
   * @example 홍길동
   */
  name: string;

  /**
   * 생성일
   *
   * @example 2021-01-01T00:00:00
   */
  createdAt: Date;

  /**
   * 수정일
   *
   * @example 2021-01-01T00:00:00
   */
  updatedAt: Date;

  static create(args: IUser.ICreateInput): UserEntity {
    const user = new UserEntity();
    user.email = args.email;
    user.password = args.password;
    user.name = args.name;

    return user;
  }

  static update(args: IUser.IUpdateInput): Partial<UserEntity> {
    const updateUserEntity = new UserEntity();
    Object.assign(updateUserEntity, args);

    return updateUserEntity;
  }

  static from(args: Prisma.user): UserEntity {
    const user = new UserEntity();
    user.idx = args.idx;
    user.email = args.email;
    user.password = args.password;
    user.name = args.name;
    user.createdAt = args.createdAt;
    user.updatedAt = args.updatedAt;

    return user;
  }
}

export namespace IUser {
  export interface ICreateInput
    extends Pick<UserEntity, 'email' | 'password' | 'name'> {}

  export interface IUpdateInput extends Partial<ICreateInput> {}
}
