import { SocialProvider } from '../../auth/constant/auth.contant';

export class UserProfileReqDto {}

export class UserProfileResDto {
  /**
   * 유저 인덱스
   *
   * @example 1
   */
  idx: number;

  /**
   * 유저 이메일
   *
   * inko513666@gmail.com
   */
  email: string;

  /**
   * 유저 이름
   *
   * @example 팜동선
   */
  name: string;

  /**
   * 유저 소셜 프로바이더
   *
   * @example google
   */
  socialProvider: SocialProvider;

  /**
   * 유저 소셜 아이디
   *
   * @example 1234567890
   */
  socialId: string;

  /**
   * 생성 일
   *
   * @example 2023-10-01T00:00:00.000Z
   */
  createdAt: Date;

  /**
   * 수정 일
   *
   * @example 2023-10-01T00:00:00.000Z
   */
  updatedAt: Date;

  constructor(args: UserProfileResDto) {
    Object.assign(this, args);
  }

  static from(args: UserProfileResDto): UserProfileResDto {
    return new UserProfileResDto(args);
  }
}
