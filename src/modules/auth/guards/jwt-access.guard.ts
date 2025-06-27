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

  /**
   * convert WS protocol to HTTP
   */
  getRequest(context: ExecutionContext) {
    const type = context.getType();
    if (type === 'ws') {
      return context.switchToWs().getClient().handshake;
    }
    if (type === 'http') {
      return context.switchToHttp().getRequest();
    }
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    if (info) {
      this.logger.debug(info);
      if (info instanceof TokenExpiredError) {
        throw new JwtAuthException('TOKEN_EXPIRED');
      }

      if (info instanceof JsonWebTokenError) {
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
