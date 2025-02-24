import { Test } from '@nestjs/testing';
import { PriceNotificationService } from '../../price-notification.service';
import { PriceNotificationRepository } from '../../repository/price-notification.repository';
import { mock, MockProxy } from 'jest-mock-extended';

describe('PriceNotificationService', () => {
  let priceNotificationService: PriceNotificationService;
  let priceNotificationRepository: MockProxy<PriceNotificationRepository>;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        PriceNotificationService,
        {
          provide: PriceNotificationRepository,
          useValue: () => mock<PriceNotificationRepository>(),
        },
      ],
    }).compile();

    priceNotificationService = app.get(PriceNotificationService);
    priceNotificationRepository = app.get(PriceNotificationRepository);
  });

  it('should be definded', () => {
    expect(priceNotificationService).toBeDefined();
  });
});
