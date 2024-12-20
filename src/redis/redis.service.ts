import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.redisClient.on('ready', () => {
      this.logger.log('Redis client is ready.');
    });

    this.redisClient.on('error', (error) => {
      this.logger.error(`Redis client error: ${error}`);
    });
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(`session:${key}`);
  }

  /**
   * 세션 사용시
   */
  async set(key: string): Promise<void> {
    this.redisClient.set(
      `session:admin`,
      key,
      'EX',
      60 * 60 * this.configService.get('DEFAUT_SESSION_HOURS'),
    );

    return;
  }
}
