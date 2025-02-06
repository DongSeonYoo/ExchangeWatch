import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WatchlistController } from '../../watchlist.controller';
import { WatchListRepository } from '../../watchlist.repository';
import { WatchlistService } from '../../watchlist.service';
import { TestConfigModule } from '../../../../../test/integration/modules/test-config.module';
import { AddWatchlistItemReqDto } from '../../dto/add-watchlist-item.dto';
import { UserEntity } from '../../../users/entities/user.entity';
import { TestClsModule } from '../../../../../test/integration/modules/test-cls.module';
import { TEST_PRISMA_TOKEN } from '../../../../../test/integration/modules/test-prisma.module';
import { ConfigService } from '@nestjs/config';
import { TestConfig } from '../../../../../test/integration/config/test.config';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';

describe('WatchListController Integration', () => {
  let watchListController: WatchlistController;
  let watchListService: WatchlistService;
  let watchListRepository: WatchListRepository;
  let prisma: PrismaService;
  let configService: ConfigService<TestConfig, true>;

  const mockUser = {
    idx: 1,
    email: 'dongseon@google.com',
    name: 'dongseon',
  } as UserEntity;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      controllers: [WatchlistController],
      providers: [WatchlistService, WatchListRepository],
    }).compile();

    watchListController = module.get(WatchlistController);
    watchListService = module.get(WatchlistService);
    watchListRepository = module.get(WatchListRepository);
    prisma = module.get(TEST_PRISMA_TOKEN);
    configService = module.get(ConfigService);
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
