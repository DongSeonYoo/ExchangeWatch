import { Test } from '@nestjs/testing';
import { NotificationRepository } from '../../notification.repository';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';
import { PrismaClient } from '@prisma/client';
import { TEST_PRISMA_TOKEN } from '../../../../../test/integration/modules/test-prisma.module';

describe('PriceNotificationRepotisory', () => {
  let priceNotificationRepository: NotificationRepository;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [NotificationRepository],
    }).compile();

    priceNotificationRepository = app.get(NotificationRepository);
    prisma = app.get(TEST_PRISMA_TOKEN);
  });

  it('should be definded', () => {
    expect(priceNotificationRepository).toBeDefined();
  });

  describe('getUserNotificationCount', () => {});
});
