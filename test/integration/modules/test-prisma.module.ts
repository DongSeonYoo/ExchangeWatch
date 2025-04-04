import { Module } from '@nestjs/common';
import { PrismaService } from '../../../src/infrastructure/database/prisma/prisma.service';
import { prismaConnection } from '../setup';

export const TEST_PRISMA_TOKEN = 'TEST_PRISMA_CLIENT';

@Module({
  providers: [
    {
      provide: TEST_PRISMA_TOKEN,
      useValue: prismaConnection,
    },
    {
      provide: PrismaService,
      useExisting: TEST_PRISMA_TOKEN,
    },
  ],
  exports: [TEST_PRISMA_TOKEN, PrismaService],
})
export class TestPrismaModule {}
