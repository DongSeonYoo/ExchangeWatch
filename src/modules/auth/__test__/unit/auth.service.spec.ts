import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../services/auth.service';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { UserEntity } from '../../../users/entities/user.entity';
import { TokenService } from '../../../token/token.service';
import { mock, MockProxy } from 'jest-mock-extended';

describe('AuthService (Unit test)', () => {
  let authService: AuthService;
  let redisService: MockProxy<RedisService>;
  let tokenService: MockProxy<TokenService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: RedisService,
          useValue: mock<RedisService>(),
        },
        {
          provide: TokenService,
          useValue: mock<TokenService>(),
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    redisService = module.get(RedisService);
    tokenService = module.get(TokenService);
  });

  describe('issueAccessAndRefreshToken', () => {
    let mockUser = {
      idx: 1,
      name: 'dongseon',
    } as UserEntity;

    it('should return access & refresh token when given a user entity', async () => {
      // Arrange
      tokenService.createAccessToken.mockResolvedValue('accessToken');
      tokenService.createRefreshToken.mockResolvedValue('refreshToken');

      // Act
      const result = await authService.issueAccessAndRefreshToken(mockUser);

      // Assert
      expect(result.accessToken).toBe('accessToken');
      expect(result.refreshToken).toBe('refreshToken');
    });

    it('should return refresh token when given a user entity', async () => {
      // Ararnge
      tokenService.createAccessToken.mockResolvedValue('accessToken');

      // Act
      const result = await authService.refreshAccessToken(mockUser);

      // Assert
      expect(result).toBe('accessToken');
    });
  });
});
