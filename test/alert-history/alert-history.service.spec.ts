import { Test, TestingModule } from '@nestjs/testing';
import { AlertHistoryService } from '../../src/apis/alert-history/alert-history.service';

describe('AlertHistoryService', () => {
  let service: AlertHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertHistoryService],
    }).compile();

    service = module.get<AlertHistoryService>(AlertHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
