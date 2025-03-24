import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../../users/users.service';
import { UserEntity } from '../../users/entities/user.entity';
import { AppConfig } from '../../../infrastructure/config/config.type';
import { IUser } from '../../users/interfaces/user.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly userService: UsersService,
  ) {
    super({
      clientID: configService.get('google.GOOGLE_CLIENT_ID', { infer: true }),
      clientSecret: configService.get('google.GOOGLE_CLIENT_SECRET', {
        infer: true,
      }),
      callbackURL: configService.get('google.GOOGLE_REDIRECT_URL', {
        infer: true,
      }),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<UserEntity> {
    const { sub, name, email } = profile._json;
    const socialProfile: IUser.ICreateBySocial = {
      socialId: sub,
      email: email!,
      name: name!,
      socialProvider: 'GOOGLE',
      password: '',
    };

    const user = await this.userService.handleSocialLogin(socialProfile);

    return user;
  }
}
