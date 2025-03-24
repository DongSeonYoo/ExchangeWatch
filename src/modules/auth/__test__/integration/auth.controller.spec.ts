import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../controllers/auth.controller';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../../users/users.service';
import { UsersRepository } from '../../../users/users.repository';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';
import { Logger } from '@nestjs/common';
import { TEST_PRISMA_TOKEN } from '../../../../../test/integration/modules/test-prisma.module';
import { GoogleStrategy } from '../../strategy/google.strategy';
import { JwtRefreshStrategy } from '../../strategy/jwt-refresh.strategy';
import { JwtAccessStrategy } from '../../strategy/jwt-access.strategy';
import { ConfigService } from '@nestjs/config';
import { TestConfig } from '../../../../../test/integration/config/test.config';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { TokenService } from '../../../token/token.service';

describe('AuthController (Integration)', () => {
  let authController: AuthController;
  let prisma: PrismaService;
  let configService: ConfigService<TestConfig, true>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        UsersService,
        JwtService,
        RedisService,
        UsersRepository,
        Logger,
        TokenService,
        GoogleStrategy,
        JwtAccessStrategy,
        JwtRefreshStrategy,
      ],
    }).compile();

    authController = module.get(AuthController);
    configService = module.get(ConfigService);
    prisma = module.get(TEST_PRISMA_TOKEN);
  });

  it('should defind', () => {
    expect(authController).toBeDefined();
  });
});
