import { Test, TestingModule } from '@nestjs/testing';
import { AlertHistoryController } from './alert-history.controller';
import { AlertHistoryService } from './alert-history.service';

describe('AlertHistoryController', () => {
  let controller: AlertHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertHistoryController],
      providers: [AlertHistoryService],
    }).compile();

    controller = module.get<AlertHistoryController>(AlertHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
