import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BaseStrategyOptions, ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../configs/config.type';
import { IToken } from '../../../token/token.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {
    super(<BaseStrategyOptions>{
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('token.JWT_ACCESS_SECRET', {
        infer: true,
      }),
    });
  }

  async validate(payload: IToken.IAccessPayload) {
    const user = await this.userService.findUserByIdx(payload.sub);

    return user;
  }
}
