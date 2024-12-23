import { Test, TestingModule } from '@nestjs/testing';
import { PriceAlertService } from './price-alert.service';

describe('PriceAlertService', () => {
  let service: PriceAlertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PriceAlertService],
    }).compile();

    service = module.get<PriceAlertService>(PriceAlertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
