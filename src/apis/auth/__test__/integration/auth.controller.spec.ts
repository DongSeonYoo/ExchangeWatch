import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../auth.controller';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RedisService } from '../../../../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../auth.service';
import { UsersService } from '../../../users/users.service';
import { TokenModule } from '../../../../token/token.module';
import { UsersRepository } from '../../../users/users.repository';
import { Logger } from '@nestjs/common';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';

describe('AuthController', () => {
  let authController: AuthController;
  let prisma: PrismaService;
  let redisService: RedisService;
  let configService: ConfigService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create(), TokenModule],
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        JwtService,
        RedisService,
        UsersRepository,
        Logger,
      ],
    }).compile();

    authController = module.get(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });
});
