import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  protected subscriber: Redis;

  constructor(
    @Inject('REDIS_CLIENT') protected readonly redisClient: Redis,
    private readonly loggerService: CustomLoggerService,
  ) {
    this.loggerService.context = RedisService.name;
  }

  onModuleDestroy() {
    this.loggerService.debug('Redis client destroyed');
    this.redisClient.quit();
  }

  /**
   * Redis default get with serialization
   * @param key
   * @returns serialized data or null
   */
  async get<T = string>(key: string): Promise<T | null> {
    try {
      const rawData = await this.redisClient.get(key);

      return rawData ? (JSON.parse(rawData) as T) : null;
    } catch (error) {
      this.loggerService.error('Json converted error: ', error);
      throw error;
    }
  }

  /**
   * Redis default get without serialization
   * @param key
   * @returns raw data or null
   */
  async getRaw(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  /**
   * Redis default set (with TTL)
   * @param key
   * @param value
   * @param ttl
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    ttl
      ? await this.redisClient.set(key, data, 'EX', ttl)
      : await this.redisClient.set(key, data);
  }

  /**
   * Redis default del
   * @param key
   */
  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  /**
   * Redis default hset
   * @param key
   * @param value
   */
  hset(key: string, value: Record<string, string | number>) {
    return this.redisClient.hset(key, value);
  }

  /**
   * Redis default hmget
   * @param key
   * @param fields
   */
  hmget(key: string, fields: string[]) {
    return this.redisClient.hmget(key, ...fields);
  }

  /**
   * Redis default publish
   * @param channel
   * @param data
   */
  publish<T extends object>(channel: string, data: T): Promise<number> {
    return this.redisClient.publish(channel, JSON.stringify(data));
  }

  get duplicate(): Redis {
    return this.redisClient.duplicate();
  }

  /**
   * Setting redis lock
   * @param key key of lock
   * @param value value of lock
   * @param ttl time to live
   */
  async setLock(key: string, value: string, ttl: number): Promise<boolean> {
    const result = await this.redisClient.set(key, value, 'EX', ttl, 'NX');
    return result === 'OK';
  }

  /**
   * Release redis lock
   * @param key key of lock
   */
  async releaseLock(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  /**
   * Renewal lock TTL
   * @param key key of lock
   * @param ttl time to live
   */
  async renewLock(key: string, ttl: number): Promise<boolean> {
    const result = await this.redisClient.expire(key, ttl);
    return result === 1;
  }
}
