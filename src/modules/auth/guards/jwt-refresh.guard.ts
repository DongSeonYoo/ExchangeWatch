import { Injectable, Logger } from '@nestjs/common';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthException } from '../exceptions/jwt-auth-exception';
import { UserNotFoundException } from '../../users/exceptions/user-not-found.exception';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('refresh') {
  private readonly logger = new Logger(JwtRefreshGuard.name);
  constructor() {
    super();
  }

  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (info) {
      if (info instanceof TokenExpiredError) {
        this.logger.debug('Token expired: ', info);
        throw new JwtAuthException('TOKEN_EXPIRED');
      }

      if (info instanceof JsonWebTokenError) {
        this.logger.debug('Token invalid: ', info);
        throw new JwtAuthException('INVALID_TOKEN');
      }

      throw new JwtAuthException('UNAUTHORIZED');
    }

    if (err instanceof UserNotFoundException) {
      this.logger.debug(
        'Token validate successfully, but user not exists',
        err,
      );
      throw new JwtAuthException('UNAUTHORIZED');
    }

    return user;
  }
}
