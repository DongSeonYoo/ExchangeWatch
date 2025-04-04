import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();

  // await prisma.users.createMany({
  //   data: [
  //     {
  //       idx: 1,
  //       email: 'test@email.com',
  //       name: 'testuser',
  //       socialId: '',
  //       socialProvider: 'TEST',
  //     },
  //     {
  //       idx: 2,
  //       email: 'test2@email.com',
  //       name: 'test2user',
  //       socialId: '',
  //       socialProvider: 'TEST2',
  //     },
  //   ],
  //   skipDuplicates: true,ㅎ
  // });
  // 환장하겠네 이거
  await prisma.users.create({
    data: {
      idx: 1,
      email: 'test@email.com',
      name: 'testuser',
      socialId: '',
      socialProvider: 'TEST',
    },
  });
  await prisma.users.create({
    data: {
      idx: 2,
      email: 'test@email.com',
      name: 'testuser',
      socialId: '',
      socialProvider: 'TEST',
    },
  });

  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
