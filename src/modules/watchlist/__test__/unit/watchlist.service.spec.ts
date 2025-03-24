import { Test } from '@nestjs/testing';
import { WatchlistService } from '../../watchlist.service';
import { WatchListRepository } from '../../watchlist.repository';
import { instance, mock, when } from 'ts-mockito';
import { AlreadyRegisterPairException } from '../../exceptions/already-register-pair.excepetion';
import { WatchlistEntity } from '../../entitites/watch-list.entity';

describe('WatchListService', () => {
  let watchListService: WatchlistService;
  const watchListRepository = mock(WatchListRepository);

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: WatchListRepository,
          useValue: instance(watchListRepository),
        },
      ],
    }).compile();

    watchListService = module.get<WatchlistService>(WatchlistService);
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
      when(
        watchListRepository.findInterestPairByUser(
          userIdx,
          dto.baseCurrency,
          dto.currencyCode,
        ),
      ).thenResolve({} as WatchlistEntity);

      // Act & Assert
      await expect(
        watchListService.createInterestCurrency(userIdx, dto),
      ).rejects.toThrow(new AlreadyRegisterPairException());
    });
  });
});
