import { Injectable } from '@nestjs/common';
import { WatchListRepository } from './watchlist.repository';
import { TransactionManager } from '../../prisma/prisma-transaction.manager';
import { AddWatchlistItemReqDto } from './dto/add-watchlist-item.dto';
import { WatchlistEntity } from './entitites/watch-list.entity';
import { AlreadyRegisterPairException } from './exceptions/already-register-pair.excepetion';
import { MaximumPairException } from './exceptions/maximum-pair.exception';
import { SelectWatchListReqDto } from './dto/select-watchlis.dto';

@Injectable()
export class WatchlistService {
  private readonly MAX_PAIR_COUNT = 10;
  constructor(
    private readonly watchListRepository: WatchListRepository,
    private readonly txManager: TransactionManager,
  ) {}

  async createInterestCurrency(
    userIdx: number,
    dto: AddWatchlistItemReqDto,
  ): Promise<WatchlistEntity> {
    // 1. Check AlreadyRegisterPairException
    const checkRegisterPair = await this.watchListRepository.findCurrencyPair(
      userIdx,
      dto.baseCurrency,
      dto.currencyCode,
    );
    if (checkRegisterPair) {
      throw new AlreadyRegisterPairException();
    }

    // 2. Check MaximumPairException
    const pairCount = await this.watchListRepository.countUserPairs(userIdx);
    if (pairCount >= this.MAX_PAIR_COUNT) {
      throw new MaximumPairException();
    }

    // Start Transactions
    const createdItem = this.txManager.runTransaction(async (tx) => {
      const lastOrder = await this.watchListRepository.findLastOrder(
        userIdx,
        tx,
      );
      const displayOrder = lastOrder === undefined ? 0 : lastOrder + 1;

      return await this.watchListRepository.insertCurrency(
        {
          userIdx: userIdx,
          baseCurrency: dto.baseCurrency,
          currencyCode: dto.currencyCode,
          displayOrder: displayOrder,
        },
        tx,
      );
    });

    return createdItem;
  }

  async getInterestCurrencyList(userIdx: number, dto: SelectWatchListReqDto) {
    const data = await this.watchListRepository.findUserWatchListsWithCursor({
      userIdx,
      cursor: dto.cursor,
      limit: dto.limit,
    });

    return {
      items: data.items,
      nextCursor: data.nextCursor,
    };
  }
}
