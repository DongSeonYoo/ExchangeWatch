import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../apis/users/entities/user.entity';
import { IToken } from './token.interface';
import { AppConfig } from '../configs/config.type';
import { randomUUID } from 'node:crypto';

@Injectable()
export class TokenService {
  private readonly logger: Logger = new Logger(TokenService.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async createAccessToken(user: UserEntity): Promise<string> {
    const payload: IToken.IAccessPayload = {
      sub: user.idx.toString(),
      email: user.email,
    };

    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get('token.JWT_ACCESS_SECRET', {
        infer: true,
      }),
      expiresIn: this.configService.get('token.ACCESS_TOKEN_EXPIRES_IN', {
        infer: true,
      }),
    });
  }

  async createRefreshToken(user: UserEntity): Promise<string> {
    const payload: IToken.IRefreshPayload = {
      jti: `rt_${randomUUID()}`,
      sub: user.idx.toString(),
    };

    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get('token.JWT_REFRESH_SECRET', {
        infer: true,
      }),
      expiresIn: this.configService.get('token.REFRESH_TOKEN_EXPIRES_IN', {
        infer: true,
      }),
    });
  }

  async verifyAccessToken(token: string): Promise<IToken.IAccessPayload> {
    return await this.jwtService.verifyAsync(token, {
      secret: this.configService.get('token.JWT_ACCESS_SECRET', {
        infer: true,
      }),
    });
  }

  async verifyRefreshToken(token: string): Promise<IToken.IRefreshPayload> {
    return await this.jwtService.verifyAsync(token, {
      secret: this.configService.get('token.JWT_REFRESH_SECRET', {
        infer: true,
      }),
    });
  }
}
