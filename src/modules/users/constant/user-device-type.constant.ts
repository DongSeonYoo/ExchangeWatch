export const USER_DEVICE_TYPE = {
  IOS: 'IOS',
  ANDROID: 'ANDROID',
};
export type UserDeviceType =
  (typeof USER_DEVICE_TYPE)[keyof typeof USER_DEVICE_TYPE];
