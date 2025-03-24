import { Module } from '@nestjs/common';
import { testPrismaConn } from '../setup';
import { PrismaService } from '../../../src/infrastructure/database/prisma/prisma.service';

export const TEST_PRISMA_TOKEN = 'TEST_PRISMA_CLIENT';

@Module({
  providers: [
    {
      provide: TEST_PRISMA_TOKEN,
      useValue: testPrismaConn,
    },
    {
      provide: PrismaService,
      useExisting: TEST_PRISMA_TOKEN,
    },
  ],
  exports: [TEST_PRISMA_TOKEN, PrismaService],
})
export class TestPrismaModule {}
