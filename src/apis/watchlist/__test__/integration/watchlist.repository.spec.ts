import { Test } from '@nestjs/testing';
import { WatchListRepository } from '../../watchlist.repository';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IWatchList } from '../../interfaces/watch-list.interface';
import { WatchlistEntity } from '../../entitites/watch-list.entity';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';

describe('WatchListRepository Integration', () => {
  let watchListRepository: WatchListRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [WatchListRepository],
    }).compile();

    watchListRepository = module.get(WatchListRepository);
    prisma = module.get(PrismaService);
  });

  describe('createInterestPair', () => {
    it('create pair', async () => {
      // Arrange
      const input: IWatchList.ICreate = {
        userIdx: 1,
        baseCurrency: 'EUR',
        currencyCode: 'KRW',
        displayOrder: 0,
      };
      const watchListEntitySpy = jest.spyOn(WatchlistEntity, 'from');

      // Act
      const result = await watchListRepository.createInterestPair(input);
      const saved = await prisma.watchlist.findFirst({
        where: {
          userIdx: 1,
          baseCurrency: input.baseCurrency,
          currencyCode: input.currencyCode,
        },
      });

      // Assert
      expect(watchListEntitySpy).toHaveBeenCalled();
      expect(result).toBeInstanceOf(WatchlistEntity);

      expect(saved?.userIdx).toBe(input.userIdx);
      expect(saved?.baseCurrency).toBe(input.baseCurrency);
      expect(saved?.currencyCode).toBe(input.currencyCode);
    });
  });
});
