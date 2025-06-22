import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { testConfiguration } from './config/test.config';

export const prismaConnection = new PrismaClient({
  datasources: {
    db: {
      url: testConfiguration().database.url,
    },
  },
});

export const redisConnection = new Redis({
  host: testConfiguration().redis.host,
  port: testConfiguration().redis.port,
});

beforeAll(async () => {
  await prismaConnection.$connect();
});

afterAll(async () => {
  await prismaConnection.$disconnect();
  if (redisConnection.status === 'ready') {
    await redisConnection.quit();
  }
});
