import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../services/auth.service';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { instance, mock, when } from 'ts-mockito';
import { UserEntity } from '../../../users/entities/user.entity';
import { TokenService } from '../../../token/token.service';

describe('AuthService (Unit test)', () => {
  let authService: AuthService;
  let redisService = mock(RedisService);
  let tokenService = mock(TokenService);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: RedisService,
          useValue: instance(redisService),
        },
        {
          provide: TokenService,
          useValue: instance(tokenService),
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('issueAccessAndRefreshToken', () => {
    let mockUser = {
      idx: 1,
      name: 'dongseon',
    } as UserEntity;

    it('should return access & refresh token when given a user entity', async () => {
      // Arrange
      when(
        tokenService.createAccessToken(mockUser.idx, mockUser.email),
      ).thenResolve('accesstoken');
      when(tokenService.createRefreshToken(mockUser.idx)).thenResolve(
        'refreshtoken',
      );

      // Act
      const result = await authService.issueAccessAndRefreshToken(mockUser);

      // Assert
      expect(result.accessToken).toBe('accesstoken');
      expect(result.refreshToken).toBe('refreshtoken');
    });

    it('should return refresh token when given a user entity', async () => {
      // Ararnge
      when(
        tokenService.createAccessToken(mockUser.idx, mockUser.email),
      ).thenResolve('accesstoken');

      // Act
      const result = await authService.refreshAccessToken(mockUser);

      // Assert
      expect(result).toBe('accesstoken');
    });
  });
});
