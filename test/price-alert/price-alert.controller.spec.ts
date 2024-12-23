import { Test, TestingModule } from '@nestjs/testing';
import { PriceAlertController } from '../../src/apis/price-alert/price-alert.controller';
import { PriceAlertService } from '../../src/apis/price-alert/price-alert.service';

describe('PriceAlertController', () => {
  let controller: PriceAlertController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PriceAlertController],
      providers: [PriceAlertService],
    }).compile();

    controller = module.get<PriceAlertController>(PriceAlertController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
