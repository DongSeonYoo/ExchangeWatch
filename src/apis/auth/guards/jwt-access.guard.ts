import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserNotFoundException } from '../../users/exceptions/user-not-found.exception';
import { JwtAuthException } from '../exceptions/jwt-auth-exception';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAccessGuard.name);
  constructor() {
    super();
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    if (info) {
      if (info instanceof TokenExpiredError) {
        this.logger.debug('Token expired: ', info);
        throw new JwtAuthException('TOKEN_EXPIRED');
      }

      if (info instanceof JsonWebTokenError) {
        this.logger.debug('Token invalid: ', info);
        throw new JwtAuthException('INVALID_TOKEN');
      }
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
