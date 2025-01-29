import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { GoogleOAuthGuard } from './guards/google.guard';
import { LoggedInUser } from '../users/decorator/logged-in-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { Response } from 'express';
import { ApiSuccess } from '../../decorators/swaggers/success.decorator';
import { LoginAuth } from '../../decorators/jwt-auth.decorator';
import { UsersService } from '../users/users.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  /**
   * 구글 소셜로그인
   *
   * @remarks 해당 엔드포인트 호출 시, 구글 로그인 페이지로 리다이렉트 됩니다. 로그인이 성공하면 특정 페이지로 리다이렉트합니다.(메인페이지)
   * cookie에 refreshtoken을 http-only로 전달합니다.
   */
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiSuccess({
    accessToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJpbmtvNTEzNjY2QGdtYWlsLmNvbSIsImlhdCI6MTczODEwMjI1NywiZXhwIjoxNzM4MTA1ODU3fQ.yCX9PpJBOSdAj7wfAn2scsLrSEz34nu9zw2NXOtT5sQ',
  })
  async googleAuthCallback(
    @LoggedInUser() user: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.issueAccessAndRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14d
    });

    return {
      accessToken,
    };
  }

  /**
   * [개발용] 구글 로그인 테스트
   *
   * @remarks 테스트 유저로 accessToken을 반환합니다. refreshToken은 쿠키에 실어서 보내줍니다
   */
  @Get('google/dev-login')
  @ApiSuccess({
    accessToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJpbmtvNTEzNjY2QGdtYWlsLmNvbSIsImlhdCI6MTczODEwMjI1NywiZXhwIjoxNzM4MTA1ODU3fQ.yCX9PpJBOSdAj7wfAn2scsLrSEz34nu9zw2NXOtT5sQ',
  })
  async googleDevLogin(@Res({ passthrough: true }) res: Response) {
    const testUser = await this.userService.findUserByIdx(1);
    const { accessToken, refreshToken } =
      await this.authService.issueAccessAndRefreshToken(testUser);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14d
    });

    return {
      accessToken,
    };
  }

  /**
   * [개발용] auth guard 테스트
   */
  @Get('auth-test')
  @ApiSuccess({
    success: 'sucess',
  })
  @LoginAuth()
  async authGuardTest(@LoggedInUser() user: UserEntity) {
    const success = 'sucess';

    return { success };
  }
}
