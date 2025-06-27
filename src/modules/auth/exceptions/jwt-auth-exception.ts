import { UnauthorizedException } from '@nestjs/common';

export const JWT_ERROR_TYPE = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;
export type JwtErrorType = (typeof JWT_ERROR_TYPE)[keyof typeof JWT_ERROR_TYPE];

export class JwtAuthException extends UnauthorizedException {
  constructor(private readonly type: JwtErrorType) {
    super(type);
  }
}
