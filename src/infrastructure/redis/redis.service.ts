import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  protected readonly logger = new Logger(RedisService.name);
  protected subscriber: Redis;

  constructor(@Inject('REDIS_CLIENT') protected readonly redisClient: Redis) {}

  onModuleDestroy() {
    this.redisClient.quit();
  }

  /**
   * Redis default get
   * @param key
   * @returns
   */
  async get<T>(key: string): Promise<T | null> {
    const rawData = await this.redisClient.get(key);
    return rawData ? (JSON.parse(rawData) as T) : null;
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
}
