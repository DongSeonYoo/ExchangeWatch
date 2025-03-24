import { Injectable, Logger } from '@nestjs/common';
import { TokenService } from '../../token/token.service';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);
  constructor(private readonly tokenService: TokenService) {}

  async issueAccessAndRefreshToken(user: UserEntity) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.createAccessToken(user.idx, user.email),
      this.tokenService.createRefreshToken(user.idx),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(user: UserEntity): Promise<string> {
    return await this.tokenService.createAccessToken(user.idx, user.email);
  }
}
