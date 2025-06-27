import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  HttpStatus,
  INestApplication,
  Logger,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import supertest from 'supertest';
import { ConfigService } from '@nestjs/config';
import { TestConfig } from '../../integration/config/test.config';
import { TestIntegrateModules } from '../../integration/utils/integrate-module.util';
import { UsersService } from '../../../src/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../../src/infrastructure/redis/redis.service';
import { UsersRepository } from '../../../src/modules/users/users.repository';
import { GoogleStrategy } from '../../../src/modules/auth/strategy/google.strategy';
import { JwtAccessStrategy } from '../../../src/modules/auth/strategy/jwt-access.strategy';
import { JwtRefreshStrategy } from '../../../src/modules/auth/strategy/jwt-refresh.strategy';
import { TEST_PRISMA_TOKEN } from '../../integration/modules/test-prisma.module';
import { UserEntity } from '../../../src/modules/users/entities/user.entity';
import { GoogleOAuthGuard } from '../../../src/modules/auth/guards/google.guard';
import { PrismaService } from '../../../src/infrastructure/database/prisma/prisma.service';
import { TokenService } from '../../../src/modules/token/token.service';
import { AuthController } from '../../../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../../../src/modules/auth/services/auth.service';

describe('/api/auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let configService: ConfigService<TestConfig, true>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      controllers: [AuthController],
      providers: [
        AuthService,
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

    app = module.createNestApplication();
    app.use(cookieParser());

    configService = module.get(ConfigService);
    prisma = module.get(TEST_PRISMA_TOKEN);

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /auth/google/callback', () => {
    const mockUser = {
      idx: 1,
      email: 'email',
      name: 'testuser',
      socialId: 'google_1234',
      socialProvider: 'GOOGLE',
    } as UserEntity;

    // Arrange
    // mocking external api(google) response to succes
    beforeEach(() => {
      jest
        .spyOn(GoogleOAuthGuard.prototype, 'canActivate')
        .mockImplementation((context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;

          return true;
        });
    });

    it('should return accessToken and set refreshToken cookie if user logs in successfully', async () => {
      // Act
      const response = await supertest(app.getHttpServer()).get(
        '/auth/google/callback',
      );

      // Assert
      const resCookies = response.headers['set-cookie'];

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('accessToken');
      expect(resCookies).toEqual(
        expect.arrayContaining([expect.stringContaining('refreshToken=')]),
      );
      expect(resCookies).toEqual(
        expect.arrayContaining([expect.stringContaining('HttpOnly; Secure')]),
      );
    });
  });

  describe('POST /api/auth/refresh', () => {
    let mockUser: UserEntity;
    beforeEach(async () => {
      // Arrange
      mockUser = {
        idx: 1,
        email: 'email',
        name: 'dongseon',
        password: '',
        socialId: '123123',
        socialProvider: 'GOOGLE',
      } as UserEntity;

      await prisma.users.create({
        data: mockUser,
      });
    });

    it('should return a new access token when refresh token is valid', async () => {
      // Arrange
      const validRefreshToken = await app
        .get(TokenService)
        .createRefreshToken(mockUser.idx);

      // Act
      const response = await supertest(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `refreshToken=${validRefreshToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 401 Unauthorized if refresh token is invalid', async () => {
      // Arrange
      let invalidRefreshToken = 'invalid.refresh.token';

      // Act
      const response = await supertest(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `refreshToken=${invalidRefreshToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 Unauthorized if refresh token is expired', async () => {
      // Arrange
      let expiredRefreshToken = await app.get(JwtService).signAsync(
        { sub: mockUser.idx, email: mockUser.email },
        {
          secret: configService.get('token.JWT_REFRESH_SECRET', {
            infer: true,
          }),
          expiresIn: '-1s',
        },
      );

      // Act
      const response = await supertest(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `refreshToken=${expiredRefreshToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
