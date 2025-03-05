import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WatchlistController } from '../../watchlist.controller';
import { WatchListRepository } from '../../watchlist.repository';
import { WatchlistService } from '../../watchlist.service';
import {
  AddWatchlistItemReqDto,
  AddWatchlistItemResDto,
} from '../../dto/add-watchlist-item.dto';
import { TEST_PRISMA_TOKEN } from '../../../../../test/integration/modules/test-prisma.module';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';
import { AlreadyRegisterPairException } from '../../exceptions/already-register-pair.excepetion';
import { MaximumPairException } from '../../exceptions/maximum-pair.exception';
import { testUser1 } from '../../../../../test/integration/setup';

describe('WatchListController Integration', () => {
  let watchListController: WatchlistController;
  let watchListRepository: WatchListRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      controllers: [WatchlistController],
      providers: [WatchlistService, WatchListRepository],
    }).compile();

    watchListController = module.get(WatchlistController);
    watchListRepository = module.get(WatchListRepository);
    prisma = module.get(TEST_PRISMA_TOKEN);
  });

  describe('registerInterestCurrency', () => {
    it('should create new watchlist item', async () => {
      // Arrange
      const reqDto: AddWatchlistItemReqDto = {
        baseCurrency: 'EUR',
        currencyCode: 'KRW',
      };

      // Act
      const result = await watchListController.registerInterestCurrency(
        reqDto,
        testUser1,
      );

      // Assert
      const addedItem = await prisma.watchlist.findFirst({
        where: {
          userIdx: testUser1.idx,
          ...reqDto,
        },
      });
      expect(result).toBeInstanceOf(AddWatchlistItemResDto);
      expect(addedItem?.userIdx).toBe(testUser1.idx);
      expect(addedItem?.baseCurrency).toBe(reqDto.baseCurrency);
      expect(addedItem?.currencyCode).toBe(reqDto.currencyCode);
    });

    it('should throw AlreadyRegisterPairException when the currency pair is already registred', async () => {
      // Arrange
      const reqDto: AddWatchlistItemReqDto = {
        baseCurrency: 'EUR',
        currencyCode: 'KRW',
      };
      await prisma.watchlist.create({
        data: {
          baseCurrency: 'EUR',
          currencyCode: 'KRW',
          userIdx: testUser1.idx,
          displayOrder: 0,
        },
      });

      // Act
      const result = async () =>
        await watchListController.registerInterestCurrency(reqDto, testUser1);

      // Assert
      await expect(result).rejects.toThrow(AlreadyRegisterPairException);
    });

    it('should throw MaximumPairException when the user has maximum number of interest currency pair', async () => {
      // Arrange
      const reqDto: AddWatchlistItemReqDto = {
        baseCurrency: 'EUR',
        currencyCode: 'KRW',
      };
      await prisma.watchlist.createMany({
        data: [
          {
            baseCurrency: 'JPY',
            currencyCode: 'USD',
            userIdx: testUser1.idx,
            displayOrder: 0,
          },
          {
            baseCurrency: 'USD',
            currencyCode: 'JPY',
            userIdx: testUser1.idx,
            displayOrder: 1,
          },
          {
            baseCurrency: 'KRW',
            currencyCode: 'EUR',
            userIdx: testUser1.idx,
            displayOrder: 2,
          },
          {
            baseCurrency: 'JPY',
            currencyCode: 'KRW',
            userIdx: testUser1.idx,
            displayOrder: 3,
          },
          {
            baseCurrency: 'KRW',
            currencyCode: 'JPY',
            userIdx: testUser1.idx,
            displayOrder: 4,
          },
          {
            baseCurrency: 'USD',
            currencyCode: 'KRW',
            userIdx: testUser1.idx,
            displayOrder: 5,
          },
          {
            baseCurrency: 'KRW',
            currencyCode: 'USD',
            userIdx: testUser1.idx,
            displayOrder: 6,
          },
          {
            baseCurrency: 'EUR',
            currencyCode: 'USD',
            userIdx: testUser1.idx,
            displayOrder: 7,
          },
          {
            baseCurrency: 'USD',
            currencyCode: 'EUR',
            userIdx: testUser1.idx,
            displayOrder: 8,
          },
          {
            baseCurrency: 'AUD',
            currencyCode: 'KRW',
            userIdx: testUser1.idx,
            displayOrder: 9,
          },
        ],
      });

      // Act
      const act = async () =>
        await watchListController.registerInterestCurrency(reqDto, testUser1);

      // Assert
      await expect(act).rejects.toThrow(MaximumPairException);
    });
  });
});
