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
import { RefreshAuth } from '../../../common/decorators/swaggers/login-auth.decorator';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../infrastructure/config/config.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  /**
   * 구글 소셜로그인 콜백
   *
   * @remarks 구글 로그인 성공 후 호출되는 콜백 엔드포인트입니다. 웹 애플리케이션 메인 페이지로 리다이렉트합니다.
   */
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(
    @LoggedInUser() user: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } =
      await this.authService.issueAccessAndRefreshToken(user);

    // refresh token httpOnly 설정
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14d
      path: '/',
    });

    // access token도 임시로 httpOnly 쿠키에 저장 (프론트엔드에서 읽어갈 수 있게)
    res.cookie('tempAccessToken', accessToken, {
      httpOnly: false, // JavaScript에서 읽을 수 있도록 설정
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 5 * 60 * 1000, // 5분 (짧은 시간)
      path: '/',
    });

    const frontendUrl = this.configService
      .get<string>('frontendURL', { infer: true })
      .split(',')
      .map((url) => url.trim());
    const redirectUrl = `${frontendUrl}/auth/callback?success=true`;

    return res.redirect(redirectUrl);
  }

  /**
   * [개발용] 테스트유저 로그인 반환
   *
   * @remarks 테스트 유저로 accessToken을 반환합니다. refreshToken은 쿠키에 실어서 보내줍니다
   */
  @Get('dev-login')
  async googleDevLogin(@Res({ passthrough: true }) res: Response) {
    const testUser = await this.userService.findUserByIdx(1);
    const { accessToken, refreshToken } =
      await this.authService.issueAccessAndRefreshToken(testUser);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14d
      path: '/',
    });

    return {
      accessToken,
      user: {
        idx: testUser.idx,
        email: testUser.email,
        name: testUser.name,
        provider: 'google',
        createdAt: testUser.createdAt.toISOString(),
      },
    };
  }

  /**
   * Access-token 갱신 엔드포인트
   *
   * @remarks httpOnly 쿠키 또는 body로부터 refresh-token을 받아 access-token을 재발급합니다
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

  /**
   * 로그아웃 엔드포인트
   *
   * @remarks refresh token 쿠키를 삭제하여 로그아웃 처리합니다
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
  }
}
