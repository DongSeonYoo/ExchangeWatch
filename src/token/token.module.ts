import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../configs/config.type';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService<AppConfig>) => ({
        secret: configService.get('token.JWT_ACCESS_SECRET', { infer: true }),
        signOptions: {
          expiresIn: configService.get('token.ACCESS_TOKEN_EXPIRES_IN', {
            infer: true,
          }),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TokenService],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
