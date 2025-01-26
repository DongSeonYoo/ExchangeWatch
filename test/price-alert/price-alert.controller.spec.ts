import { Test, TestingModule } from '@nestjs/testing';
import { PriceNotificationController } from '../../src/apis/price-alert/price-notification.controller';
import { PriceNotificationService } from '../../src/apis/price-alert/price-notification.service';

describe('PriceAlertController', () => {
  let controller: PriceNotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PriceNotificationController],
      providers: [PriceNotificationService],
    }).compile();

    controller = module.get<PriceNotificationController>(
      PriceNotificationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
