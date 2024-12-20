import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthException } from 'src/apis/auth/exceptions/jwt-auth-exception';

@Injectable()
export class TokenService {
  private readonly logger: Logger = new Logger(TokenService.name);
  constructor(private readonly jwtService: JwtService) {}

  generateToken() {
    this.logger.log('token generated');

    return this.jwtService.sign({
      /** token info... */
    });
  }

  verifyToken(token: string) {
    this.logger.log('token decoded');

    try {
      const payload =
        /** <specify payload-type use generic > */ this.jwtService.verify(
          token,
        );

      return payload;
    } catch (error) {
      this.logger.error('토큰 검증에 실패했습니다.');
      throw new JwtAuthException();
    }
  }
}
