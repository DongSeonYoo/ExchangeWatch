import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { UserEntity } from '../users/entities/user.entity';
import { TokenService } from '../../token/token.service';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);
  constructor(
    private readonly redisService: RedisService,
    private readonly tokenService: TokenService,
  ) {}

  async issueAccessAndRefreshToken(user: UserEntity) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.createAccessToken(user.idx, user.email),
      this.tokenService.createRefreshToken(user.idx),
    ]);

    return { accessToken, refreshToken };
  }
}
