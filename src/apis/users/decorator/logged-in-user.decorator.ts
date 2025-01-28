import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserEntity } from '../entities/user.entity';

export const LoggedInUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserEntity => {
    const req: Request = ctx.switchToHttp().getRequest();

    return req.user as UserEntity;
  },
);
