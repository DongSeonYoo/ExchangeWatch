import { UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiExceptions } from './swaggers/exception.decorator';
import { JwtGuard } from 'src/apis/auth/guards/jwt.guard';
import { JwtAuthException } from 'src/apis/auth/exceptions/jwt-auth-exception';

export const LoginAuth = () => {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(JwtGuard),
    ApiExceptions({
      exampleTitle: '로그인 하지 않았을 경우',
      schema: JwtAuthException,
    }),
  );
};
