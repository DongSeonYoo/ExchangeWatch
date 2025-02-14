import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  onModuleDestroy() {
    this.redisClient.quit();
  }

  /**
   * Redis default get
   * @param key
   * @returns
   */
  async get<T>(key: string): Promise<T | null> {
    this.redisClient.get;
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
   * Redis batch set 'pipeline'
   * @param commands
   */
  async batchSet(commands: [string, string, 'EX', number][]) {
    const pipeline = this.redisClient.pipeline();
    commands.forEach((cmd) => pipeline.set(...cmd));
    await pipeline.exec();
  }

  /**
   * Redis batch set 'pipeline'
   * @param keys
   */
  async batchGet<T>(keys: string[]): Promise<T[]> {
    const rawData = await this.redisClient.mget(keys);
    return rawData
      .map((data) => (data ? JSON.parse(data) : null))
      .filter((item) => item !== null) as T[];
  }
}
