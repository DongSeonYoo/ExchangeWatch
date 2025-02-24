import { Test } from '@nestjs/testing';
import { PriceNotificationRepository } from '../../repository/price-notification.repository';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';

describe('PriceNotificationRepotisory', () => {
  let priceNotificationRepository: PriceNotificationRepository;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [PriceNotificationRepository],
    }).compile();

    priceNotificationRepository = app.get(PriceNotificationRepository);
  });

  it('should be definded', () => {
    expect(priceNotificationRepository).toBeDefined();
  });
});
