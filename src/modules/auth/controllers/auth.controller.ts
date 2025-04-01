import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ApiTags } from '@nestjs/swagger';
import { GoogleOAuthGuard } from '../guards/google.guard';
import { LoggedInUser } from '../../users/decorator/logged-in-user.decorator';
import { UserEntity } from '../../users/entities/user.entity';
import { Response } from 'express';
import { UsersService } from '../../users/users.service';
import { ApiSuccess } from '../../../common/decorators/swaggers/success.decorator';
import {
  AccessAuth,
  RefreshAuth,
} from '../../../common/decorators/swaggers/login-auth.decorator';

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
   * @remarks 해당 엔드포인트 호출 시, 구글 로그인 페이지로 리다이렉트 된 후, 로그인이 성공하면 특정 페이지로 리다이렉트합니다.(메인페이지)
   * redirect시 다음과같이 쿼리 정보에 로그인 된 유저 정보를 포함합니다. (accessToken, refreshToken, userIdx, email, name)
   */
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(
    @LoggedInUser() user: UserEntity,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } =
      await this.authService.issueAccessAndRefreshToken(user);

    const redirectUrl = `dongseon://accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}&userIdx=${user.idx}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}`;

    res.redirect(redirectUrl);
  }

  /**
   * [개발용] 구글 로그인 테스트
   *
   * @remarks 테스트 유저로 accessToken을 반환합니다. refreshToken은 쿠키에 실어서 보내줍니다
   */
  @Get('google/dev-login')
  @ApiSuccess({
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
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
  @AccessAuth()
  async authGuardTest(@LoggedInUser() user: UserEntity) {
    const success = 'sucess';

    return { success };
  }

  /**
   * Access-token 갱신 엔드포인트
   *
   * @remarks 헤더에 http-only 속성으로 적용되어있는 refresh token을 통해 새로운 access token을 발급받습니다.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @RefreshAuth()
  @ApiSuccess({
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  async refreshToken(@LoggedInUser() user: UserEntity) {
    const accessToken = await this.authService.refreshAccessToken(user);

    return {
      accessToken,
    };
  }
}
