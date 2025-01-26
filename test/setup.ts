// test/integration/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

beforeAll(async () => {
  // DB 연결
  console.log('connected tset database');
  await prisma.$connect();
});

beforeEach(async () => {
  // 테스트 데이터 초기화
  await prisma.$transaction([
    prisma.exchangeRates.deleteMany(),
    prisma.exchangeRatesDaily.deleteMany(),
  ]);
});

afterAll(async () => {
  // DB 연결 종료
  await prisma.$disconnect();
});
