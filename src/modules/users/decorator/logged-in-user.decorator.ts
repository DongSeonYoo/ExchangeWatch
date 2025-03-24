import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';

export const LoggedInUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const type = ctx.getType();
    if (type === 'http') {
      const req = ctx.switchToHttp().getRequest();
      return req.user as UserEntity;
    }

    /**
     * convert WS protocol to HTTP
     */
    if (type === 'ws') {
      const req = ctx.switchToWs().getClient().handshake;
      return req.user as UserEntity;
    }
  },
);
