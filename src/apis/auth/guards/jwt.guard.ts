import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserNotFoundException } from '../../users/exceptions/user-not-found.exception';
import { JwtAuthException } from '../exceptions/jwt-auth-exception';
import { JsonWebTokenError } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
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
      if (info instanceof JsonWebTokenError) {
        this.logger.debug('Token invalid: ', info);
      }

      throw new JwtAuthException();
    }

    if (err instanceof UserNotFoundException) {
      this.logger.debug(
        'Token validate successfully, but user not exists',
        err,
      );
      throw new JwtAuthException();
    }

    return user;
  }
}
