import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategy/google.strategy';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../../redis/redis.module';
import { TokenModule } from '../../token/token.module';
import { GoogleOAuthGuard } from './guards/google.guard';

@Module({
  imports: [UsersModule, RedisModule, TokenModule],
  exports: [AuthService],
  controllers: [AuthController],
  providers: [AuthService, GoogleOAuthGuard, GoogleStrategy],
})
export class AuthModule {}
