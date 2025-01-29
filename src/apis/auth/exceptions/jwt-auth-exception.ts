import { UnauthorizedException } from '@nestjs/common';

export class JwtAuthException extends UnauthorizedException {
  constructor(message: string = 'You need to login') {
    super(message);
  }
}
