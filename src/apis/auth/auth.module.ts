import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategy/google.strategy';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../../redis/redis.module';
import { TokenModule } from '../../token/token.module';
import { JwtAccessStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [UsersModule, RedisModule, TokenModule],
  exports: [AuthService],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtAccessStrategy],
})
export class AuthModule {}
