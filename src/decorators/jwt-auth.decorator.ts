import { UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiExceptions } from './swaggers/exception.decorator';
import { JwtAuthGuard } from 'src/apis/auth/guards/jwt.guard';
import { JwtAuthException } from 'src/apis/auth/exceptions/jwt-auth-exception';

export const LoginAuth = () => {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    UseGuards(JwtAuthGuard),
    ApiExceptions({
      exampleTitle: 'accessToken이 올바르지 않은 경우',
      schema: JwtAuthException,
    }),
  );
};
