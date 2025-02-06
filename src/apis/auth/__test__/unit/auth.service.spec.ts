import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../auth.service';
import { RedisService } from '../../../../redis/redis.service';
import { instance, mock } from 'ts-mockito';
import { TokenService } from '../../../../token/token.service';

describe('AuthService', () => {
  let service: AuthService;
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

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
