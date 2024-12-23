import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistController } from '../../src/apis/watchlist/watchlist.controller';
import { WatchlistService } from '../../src/apis/watchlist/watchlist.service';

describe('WatchlistController', () => {
  let controller: WatchlistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WatchlistController],
      providers: [WatchlistService],
    }).compile();

    controller = module.get<WatchlistController>(WatchlistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
