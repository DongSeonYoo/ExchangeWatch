import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, WithSecretOrKey } from 'passport-jwt';
import { AppConfig } from '../../../infrastructure/config/config.type';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';
import { IToken } from '../../token/token.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {
    super(<WithSecretOrKey>{
      jwtFromRequest: (req: Request) => {
        return req.cookies?.refreshToken;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get('token.JWT_REFRESH_SECRET', {
        infer: true,
      }),
    });
  }

  async validate(payload: IToken.IRefreshPayload) {
    const user = await this.userService.findUserByIdx(payload.sub);

    return user;
  }
}
