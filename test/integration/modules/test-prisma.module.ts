import { Module } from '@nestjs/common';
import { PrismaService } from '../../../src/infrastructure/database/prisma/prisma.service';
import { TestFixtureUtil } from '../utils/integrate-test-fixture.util';

export const TEST_PRISMA_TOKEN = 'TEST_PRISMA_CLIENT';

@Module({
  providers: [
    {
      provide: TEST_PRISMA_TOKEN,
      useValue: TestFixtureUtil.getInstance().prisma,
    },
    {
      provide: PrismaService,
      useExisting: TEST_PRISMA_TOKEN,
    },
  ],
  exports: [TEST_PRISMA_TOKEN, PrismaService],
})
export class TestPrismaModule {}
