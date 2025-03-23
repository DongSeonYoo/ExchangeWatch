import Redis from 'ioredis';

export interface IRedisSubscriber {
  subscribe(): Promise<void>;
  handleMessage(pattern: string, channel: string, message: string): void;
  unsubscribe(): Promise<void>;
}
