import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TEST_PRISMA_TOKEN, TestPrismaModule } from './test-prisma.module';

@Module({
  imports: [
    ClsModule.forRoot({
      plugins: [
        new ClsPluginTransactional({
          imports: [TestPrismaModule],
          adapter: new TransactionalAdapterPrisma({
            prismaInjectionToken: TEST_PRISMA_TOKEN,
          }),
        }),
      ],
    }),
  ],
})
export class TestClsModule {}
