import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../infrastructure/config/config.type';
import { UsersService } from '../../users/users.service';
import { IToken } from '../../token/token.interface';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {
    super({
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
