import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();

  // 테스트용 사용자 데이터 생성
  try {
    await prisma.users.create({
      data: {
        idx: 1,
        email: 'test@email.com',
        name: 'testuser',
        socialId: '',
        socialProvider: 'TEST',
      },
    });
    console.log('Test user 1 created');
  } catch (error) {
    console.log('User 1 already exists, skipping...');
  }

  try {
    await prisma.users.create({
      data: {
        idx: 2,
        email: 'test2@email.com',
        name: 'test2user',
        socialId: '',
        socialProvider: 'TEST',
      },
    });
    console.log('Test user 2 created');
  } catch (error) {
    console.log('User 2 already exists, skipping...');
  }

  console.log('Test data seeding completed');
}

main()
  .catch((e) => {
    console.error('Error occurred while seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
