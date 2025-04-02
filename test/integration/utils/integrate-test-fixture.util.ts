import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { testConfiguration } from '../config/test.config';
import { UserEntity } from '../../../src/modules/users/entities/user.entity';

export class TestFixtureUtil {
  private static instance: TestFixtureUtil;
  public prisma: PrismaClient;
  public redis: Redis;
  private initialized = false;
  private testUser1: UserEntity;
  private testUser2: UserEntity;

  private constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: testConfiguration().database.url,
        },
      },
    });
    this.redis = new Redis({
      host: testConfiguration().redis.host,
      port: testConfiguration().redis.port,
    });

    this.initialized = true;
  }

  public getTestUser1(): UserEntity {
    return this.testUser1;
  }

  public getTestUser2(): UserEntity {
    return this.testUser2;
  }

  static getInstance(): TestFixtureUtil {
    if (!TestFixtureUtil.instance) {
      TestFixtureUtil.instance = new TestFixtureUtil();
    }

    return TestFixtureUtil.instance;
  }

  async setUp() {
    if (this.initialized) {
      return;
    }

    await this.prisma.$connect();
    this.redis
      .on('ready', () => {
        console.log('@@Connected redis for test@@');
      })
      .on('error', (err) => {
        console.log('redis connection error', err);
      });
  }

  async createTestUser() {
    await this.prisma.users
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
        console.log('@@Test users created@@');
      });
  }

  async resetAll() {
    await this.prisma.watchlist.deleteMany();
    await this.prisma.exchangeRatesDaily.deleteMany();
    await this.prisma.news.deleteMany();
    await this.prisma.notifications.deleteMany();
    await this.prisma.notificationsHistories.deleteMany();
    await this.prisma.users.deleteMany();
  }

  async tearDown() {
    await this.prisma.$disconnect();
    await this.redis.quit();
  }
}
