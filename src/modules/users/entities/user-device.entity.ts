import * as Prisma from '@prisma/client';
import { UserDeviceType } from '../constant/user-device-type.constant';

export class UserDeviceEntity {
  /**
   * 유저 디바이스 인덱스 (uuid)
   *
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  idx: string;

  /**
   * 유저 인덱스
   *
   * @example 1
   */
  userIdx: number;

  /**
   * 디바이스 토큰
   *
   * @example "abcdef1234567890"
   */
  deviceToken: string;

  /**
   * 디바이스 타입
   *
   * @example "ANDROID" | "IOS"
   */
  deviceType: UserDeviceType;

  /**
   * 토큰 생성 일시
   */
  createdAt: Date;

  constructor(args: UserDeviceEntity) {
    Object.assign(this, args);
  }

  static from(args: Prisma.UserDevices): UserDeviceEntity {
    return new UserDeviceEntity({
      idx: args.idx,
      userIdx: args.userIdx,
      deviceToken: args.deviceToken,
      deviceType: args.deviceType,
      createdAt: args.createdAt,
    });
  }
}
