import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WatchlistController } from '../../watchlist.controller';
import { WatchListRepository } from '../../watchlist.repository';
import { WatchlistService } from '../../watchlist.service';
import { TestConfigModule } from '../../../../../test/integration/config/test-config.module';
import { TransactionManager } from '../../../../prisma/prisma-transaction.manager';
import { PrismaModule } from '../../../../prisma/prisma.module';
import { AddWatchlistItemReqDto } from '../../dto/add-watchlist-item.dto';
import { UserEntity } from '../../../users/entities/user.entity';

describe('WatchListController Integration', () => {
  let watchListController: WatchlistController;
  let watchListService: WatchlistService;
  let watchListRepository: WatchListRepository;
  let prisma: PrismaService;

  const mockUser = {
    idx: 1,
    email: 'dongseon@google.com',
    name: 'dongseon',
  } as UserEntity;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TestConfigModule, PrismaModule],
      controllers: [WatchlistController],
      providers: [WatchlistService, WatchListRepository, TransactionManager],
    }).compile();

    watchListController = module.get(WatchlistController);
    watchListService = module.get(WatchlistService);
    watchListRepository = module.get(WatchListRepository);
    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.users.create({
      data: {
        ...mockUser,
        socialProvider: '',
        socialId: '',
      },
    });
  });

  afterEach(async () => {
    await prisma.watchlist.deleteMany();
    await prisma.users.deleteMany();
  });

  it('should be defined', () => {
    expect(watchListController).toBeDefined();
  });

  describe('registerInterestCurrency', () => {
    it('should create new watchlist item', async () => {
      // Arragne
      const dto: AddWatchlistItemReqDto = {
        baseCurrency: 'USD',
        currencyCode: 'KRW',
      };

      // Act
      const result = await watchListController.registerInterestCurrency(
        dto,
        mockUser,
      );
      const saved = await prisma.watchlist.findFirst({
        where: {
          userIdx: mockUser.idx,
          baseCurrency: dto.baseCurrency,
          currencyCode: dto.currencyCode,
        },
      });

      // Assert
      expect(result.idx).toBeDefined();
      expect(saved).toBeTruthy();
    });
  });
});
