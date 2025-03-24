import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  SocialAuthErrorCode,
  SocialAuthException,
} from '../exceptions/social-auth.exception';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleOAuthGuard.name);
  constructor() {
    super();
  }

  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ) {
    if (err) {
      switch (err.code) {
        case 'invalid_grant':
          throw new SocialAuthException(
            'GOOGLE',
            SocialAuthErrorCode.INVALID_AUTH_CODE,
          );
      }
    }

    return user;
  }
}
