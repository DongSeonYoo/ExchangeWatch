import { UnauthorizedException } from '@nestjs/common';

export class JwtAuthException extends UnauthorizedException {
  constructor(message: string = '로그인 후 이용 가능합니다') {
    super(message);
  }
}
