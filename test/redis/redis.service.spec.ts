import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../../src/redis/redis.service';
import { RedisClient } from 'ioredis/built/connectors/SentinelConnector/types';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('RedisService', () => {
  let redisService: RedisService;
  let mockRedisClient: RedisClient;
  let mockLogger: Logger;

  beforeEach(async () => {
    mockRedisClient = {
      on: jest.fn(),
      get: jest.fn(),
    } as unknown as RedisClient;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
        ConfigService,
      ],
    }).compile();

    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(redisService).toBeDefined();
  });

  it('onModuleInit should be called', () => {
    const onModuleInitSpy = jest.spyOn(redisService, 'onModuleInit');

    redisService.onModuleInit();

    expect(onModuleInitSpy).toHaveBeenCalled();
  });
});
