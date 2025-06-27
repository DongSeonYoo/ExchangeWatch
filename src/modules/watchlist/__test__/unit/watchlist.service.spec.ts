import { Test } from '@nestjs/testing';
import { WatchlistService } from '../../watchlist.service';
import { WatchListRepository } from '../../watchlist.repository';
import { AlreadyRegisterPairException } from '../../exceptions/already-register-pair.excepetion';
import { WatchlistEntity } from '../../entitites/watch-list.entity';
import { mock, MockProxy } from 'jest-mock-extended';

describe('WatchListService', () => {
  let watchListService: WatchlistService;
  let watchListRepository: MockProxy<WatchListRepository>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: WatchListRepository,
          useValue: mock(WatchListRepository),
        },
      ],
    }).compile();

    watchListService = module.get<WatchlistService>(WatchlistService);
    watchListRepository = module.get(WatchListRepository);
  });

  it('should be defined', () => {
    expect(watchListService).toBeDefined();
  });

  describe('createInterestCurrency', () => {
    const userIdx = 1;
    const dto = {
      baseCurrency: 'EUR',
      currencyCode: 'KRW',
    };

    it('should throw AlreadyRegisterPairException when pair exists', async () => {
      // Arrange
      watchListRepository.findInterestPairByUser.mockResolvedValue(
        {} as WatchlistEntity,
      );

      // Act & Assert
      await expect(
        watchListService.createInterestCurrency(userIdx, dto),
      ).rejects.toThrow(new AlreadyRegisterPairException());
    });
  });
});
