import { Test } from '@nestjs/testing';
import { NotificationHistoryRepository } from '../../repository/notification-history.repository';
import { TestIntegrateModules } from '../../../../../../test/integration/utils/integrate-module.util';

describe('NotificationHistoryRepository', () => {
  let priceNotificationRepository: NotificationHistoryRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [NotificationHistoryRepository],
    }).compile();

    priceNotificationRepository = module.get(NotificationHistoryRepository);
  });

  it('should be definded', () => {
    expect(priceNotificationRepository).toBeDefined();
  });
});
