import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WatchlistController } from '../../watchlist.controller';
import { WatchListRepository } from '../../watchlist.repository';
import { WatchlistService } from '../../watchlist.service';
import {
  AddWatchlistItemReqDto,
  AddWatchlistItemResDto,
} from '../../dto/add-watchlist-item.dto';
import { UserEntity } from '../../../users/entities/user.entity';
import { TEST_PRISMA_TOKEN } from '../../../../../test/integration/modules/test-prisma.module';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';
import { AlreadyRegisterPairException } from '../../exceptions/already-register-pair.excepetion';
import { MaximumPairException } from '../../exceptions/maximum-pair.exception';

describe('WatchListController Integration', () => {
  let watchListController: WatchlistController;
  let watchListRepository: WatchListRepository;
  let prisma: PrismaService;
  let mockUser: UserEntity;

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

  beforeEach(async () => {
    mockUser = {
      idx: 1,
      email: 'test@mail.com',
      name: 'dongseon',
      socialId: 'google',
      socialProvider: 'GOOGLE',
    } as UserEntity;

    await prisma.users.create({
      data: {
        ...mockUser,
      },
    });
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
        mockUser,
      );

      // Assert
      const addedItem = await prisma.watchlist.findFirst({
        where: {
          userIdx: mockUser.idx,
          ...reqDto,
        },
      });
      expect(result).toBeInstanceOf(AddWatchlistItemResDto);
      expect(addedItem?.userIdx).toBe(mockUser.idx);
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
          userIdx: mockUser.idx,
          displayOrder: 0,
        },
      });

      // Act
      const result = async () =>
        await watchListController.registerInterestCurrency(reqDto, mockUser);

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
            userIdx: mockUser.idx,
            displayOrder: 0,
          },
          {
            baseCurrency: 'USD',
            currencyCode: 'JPY',
            userIdx: mockUser.idx,
            displayOrder: 1,
          },
          {
            baseCurrency: 'KRW',
            currencyCode: 'EUR',
            userIdx: mockUser.idx,
            displayOrder: 2,
          },
          {
            baseCurrency: 'JPY',
            currencyCode: 'KRW',
            userIdx: mockUser.idx,
            displayOrder: 3,
          },
          {
            baseCurrency: 'KRW',
            currencyCode: 'JPY',
            userIdx: mockUser.idx,
            displayOrder: 4,
          },
          {
            baseCurrency: 'USD',
            currencyCode: 'KRW',
            userIdx: mockUser.idx,
            displayOrder: 5,
          },
          {
            baseCurrency: 'KRW',
            currencyCode: 'USD',
            userIdx: mockUser.idx,
            displayOrder: 6,
          },
          {
            baseCurrency: 'EUR',
            currencyCode: 'USD',
            userIdx: mockUser.idx,
            displayOrder: 7,
          },
          {
            baseCurrency: 'USD',
            currencyCode: 'EUR',
            userIdx: mockUser.idx,
            displayOrder: 8,
          },
          {
            baseCurrency: 'AUD',
            currencyCode: 'KRW',
            userIdx: mockUser.idx,
            displayOrder: 9,
          },
        ],
      });

      // Act
      const act = async () =>
        await watchListController.registerInterestCurrency(reqDto, mockUser);

      // Assert
      await expect(act).rejects.toThrow(MaximumPairException);
    });
  });
});
