import { HttpException, HttpStatus } from '@nestjs/common';
import { SocialProvider } from '../../../constant';

export class SocialAuthException extends HttpException {
  constructor(
    private readonly provider: SocialProvider,
    private readonly code: SocialAuthErrorCode,
    private readonly details?: Record<string, any>,
  ) {
    super(code, HttpStatus.UNAUTHORIZED);
  }
}

export enum SocialAuthErrorCode {
  // about AUTH_CODE
  INVALID_AUTH_CODE = 'INVALID_AUTH_CODE',
  CODE_ALREADY_USED = 'CODE_ALREADY_USED',

  // about ACCESS_TOKEN
  INVALID_ACCESS_TOKEN = 'INVALID_ACCESS_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // about USER_INFO
  USER_INFO_FAILED = 'USER_INFO_FAILED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  REQUIRED_INFO_MISSING = 'REQUIRED_INFO_MISSING',

  // about SOCIAL_SERVICE status
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
