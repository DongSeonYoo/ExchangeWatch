import { UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiExceptions } from './exception.decorator';
import {
  JwtAuthException,
  JwtErrorType,
} from 'src/modules/auth/exceptions/jwt-auth-exception';
import { JwtAccessGuard } from '../../../modules/auth/guards/jwt-access.guard';
import { JwtRefreshGuard } from '../../../modules/auth/guards/jwt-refresh.guard';

export const AccessAuth = () => {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    UseGuards(JwtAccessGuard),
    ApiExceptions(
      {
        exampleTitle: 'access token이 올바르지 않은 경우',
        schema: JwtAuthException,
        message: 'INVALID_TOKEN' as JwtErrorType,
      },
      {
        exampleTitle: 'access token이 만료되었을 경우',
        schema: JwtAuthException,
        message: 'TOKEN_EXPIRED' as JwtErrorType,
      },
      {
        exampleTitle: 'access token이 없을 경우',
        schema: JwtAuthException,
        message: 'UNAUTHORIZED' as JwtErrorType,
      },
      {
        exampleTitle: '존재하지 않는 유저일 경우',
        schema: JwtAuthException,
        message: 'UNAUTHORIZED' as JwtErrorType,
      },
    ),
  );
};

export const RefreshAuth = () => {
  return applyDecorators(
    UseGuards(JwtRefreshGuard),
    ApiExceptions(
      {
        exampleTitle: 'refresh token이 올바르지 않은 경우',
        schema: JwtAuthException,
        message: 'INVALID_TOKEN' as JwtErrorType,
      },
      {
        exampleTitle: 'refresh token이 만료되었을 경우',
        schema: JwtAuthException,
        message: 'TOKEN_EXPIRED' as JwtErrorType,
      },
      {
        exampleTitle: 'refresh token이 없을 경우',
        schema: JwtAuthException,
        message: 'UNAUTHORIZED' as JwtErrorType,
      },
      {
        exampleTitle: '존재하지 않는 유저일 경우',
        schema: JwtAuthException,
        message: 'UNAUTHORIZED' as JwtErrorType,
      },
    ),
  );
};
