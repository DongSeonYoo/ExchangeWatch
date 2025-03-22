import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
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
   * subscribe redis channel
   * @param channel name of channel
   */
  async subscribe(channel: string): Promise<void> {
    await this.subscriber.subscribe(channel);
  }

  /**
   * unsubscribe redis channel
   * @param channel name of channel
   */
  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }
}
