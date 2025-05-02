import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import {
  USER_DEVICE_TYPE,
  UserDeviceType,
} from '../constant/user-device-type.constant';

export class UserDeviceRegisterReqDto {
  /**
   * 디바이스 토큰
   *
   * @example "device-token-123456"
   */
  @IsNotEmpty()
  @IsString()
  @Length(100, 300)
  deviceToken: string;

  /**
   * 디바이스 타입
   *
   * @example "ANDROID"
   */
  @IsNotEmpty()
  @IsEnum(USER_DEVICE_TYPE)
  deviceType: UserDeviceType;
}
