import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { testConfiguration } from './config/test.config';
import Redis from 'ioredis';

// Create database(postgres) connection for test

export const testPrismaConn = new PrismaClient({
  datasources: {
    db: {
      url: testConfiguration().database.url,
    },
  },
});

// Create database(postgres) connection for test
export const testRedisConn = new Redis({
  host: testConfiguration().redis.host,
  port: testConfiguration().redis.port,
});

// Connect test-database
beforeAll(() => {
  // const testUser
  testPrismaConn.$connect().then(() => {
    console.log('@@Connected postgres for test@@');
  });

  testRedisConn.on('ready', () => {
    console.log('@@Connected redis for test@@');
  });

  testRedisConn.on('error', (err) => {
    console.log('redis connection error', err);
  });
});

// Remove tables test independency
beforeEach(async () => {
  await testPrismaConn.watchlist.deleteMany();
  await testPrismaConn.exchangeRates.deleteMany();
  await testPrismaConn.exchangeRatesDaily.deleteMany();
  await testPrismaConn.news.deleteMany();
  await testPrismaConn.notifications.deleteMany();
  await testPrismaConn.notificationsHistories.deleteMany();
  await testPrismaConn.users.deleteMany();

  await testPrismaConn.users
    .createMany({
      data: [
        {
          idx: 1,
          email: 'test@email.com',
          name: 'testuser',
          socialId: '',
          socialProvider: 'TEST',
        },
        {
          idx: 2,
          email: 'test2@email.com',
          name: 'test2user',
          socialId: '',
          socialProvider: 'TEST2',
        },
      ],
    })
    .then(() => {
      console.log('created test user!!');
    });
});

afterEach(async () => {
  jest.clearAllMocks();

  await testPrismaConn.watchlist.deleteMany();
  await testPrismaConn.exchangeRates.deleteMany();
  await testPrismaConn.exchangeRatesDaily.deleteMany();
  await testPrismaConn.news.deleteMany();
  await testPrismaConn.notifications.deleteMany();
  await testPrismaConn.notificationsHistories.deleteMany();
  await testPrismaConn.users.deleteMany();
});

// Clear data in redis for test independency
afterEach(async () => {
  await testRedisConn.flushall();
});

// Close connection
afterAll(async () => {
  await testPrismaConn.$disconnect().then(() => {
    console.log('!!disconnected postgres for test!!');
  });
  await testRedisConn.quit().then(() => {
    console.log('!!disconnected redis for test!!');
  });
});
