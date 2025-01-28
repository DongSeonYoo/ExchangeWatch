import Prisma from '@prisma/client';
import { SocialProvider } from '../../../constant';

export class UserEntity {
  /**
   * 유저 인덱스
   * @example 1
   */
  idx: number;

  /**
   * 유저 이메일
   * @example "user@example.com"
   */
  email: string;

  /**
   * 유저 이름
   * @example "홍길동"
   */
  name: string;

  /**
   * 비밀번호 (소셜 로그인의 경우 null)
   * @example null
   */
  password: string | null;

  /**
   * 소셜 로그인 제공자
   * @example "KAKAO"
   */
  socialProvider: SocialProvider;

  /**
   * 소셜 로그인 ID
   * @example "12345678"
   */
  socialId: string;

  /**
   * 생성일시
   * @example "2024-01-01T00:00:00.000Z"
   */
  createdAt: Date;

  /**
   * 수정일시
   * @example "2024-01-01T00:00:00.000Z"
   */
  updatedAt: Date;

  constructor(args: UserEntity) {
    Object.assign(this, args);
  }

  static from(args: Prisma.Users): UserEntity {
    return new UserEntity({
      idx: args.idx,
      email: args.email,
      name: args.name,
      password: args.password,
      socialId: args.socialId,
      socialProvider: args.socialProvider as SocialProvider,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
  }
}
