import { UserDeviceType } from '../constant/user-device-type.constant';
import { UserDeviceEntity } from '../entities/user-device.entity';

export namespace IUserDevice {
  export type IUserDeviceType = UserDeviceType;

  export interface ICreate
    extends Pick<UserDeviceEntity, 'userIdx' | 'deviceToken' | 'deviceType'> {}
}
