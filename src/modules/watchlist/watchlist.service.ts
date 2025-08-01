import { Injectable } from '@nestjs/common';
import { WatchListRepository } from './watchlist.repository';
import { AddWatchlistItemReqDto } from './dto/add-watchlist-item.dto';
import { WatchlistEntity } from './entitites/watch-list.entity';
import { AlreadyRegisterPairException } from './exceptions/already-register-pair.excepetion';
import { MaximumPairException } from './exceptions/maximum-pair.exception';
import { SelectWatchListReqDto } from './dto/select-watchlist.dto';
import { CurrencyPairNotFoundException } from './exceptions/currency-pair-not-found.exception';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class WatchlistService {
  private readonly MAX_PAIR_COUNT = 10;
  constructor(private readonly watchListRepository: WatchListRepository) {}

  async createInterestCurrency(
    userIdx: number,
    dto: AddWatchlistItemReqDto,
  ): Promise<WatchlistEntity> {
    // 1. Check AlreadyRegisterPairException
    const checkRegisterPair =
      await this.watchListRepository.findInterestPairByUser(
        userIdx,
        dto.baseCurrency,
        dto.currencyCode,
      );
    if (checkRegisterPair) {
      throw new AlreadyRegisterPairException();
    }

    // 2. Check MaximumPairException
    const pairCount =
      await this.watchListRepository.findInterestPairCountByUser(userIdx);
    if (pairCount >= this.MAX_PAIR_COUNT) {
      throw new MaximumPairException();
    }

    const lastOrder = await this.watchListRepository.findLastOrder(userIdx);
    const displayOrder = lastOrder === undefined ? 0 : lastOrder + 1;

    return await this.watchListRepository.createInterestPair({
      userIdx: userIdx,
      baseCurrency: dto.baseCurrency,
      currencyCode: dto.currencyCode,
      displayOrder: displayOrder,
    });
  }

  async getInterestCurrencyList(
    userIdx: number,
    dto: SelectWatchListReqDto,
  ): Promise<{ items: WatchlistEntity[]; nextCursor: number | undefined }> {
    const data = await this.watchListRepository.findInterestPairsWithCursor({
      userIdx,
      cursor: dto.cursor,
      limit: dto.limit,
    });

    return {
      items: data.items,
      nextCursor: data.nextCursor,
    };
  }

  async deleteInterstCurrency(pairIdx: number, userIdx: number): Promise<void> {
    const foundExistPair = await this.watchListRepository.findInterestPairByIdx(
      pairIdx,
      userIdx,
    );
    if (!foundExistPair) {
      throw new CurrencyPairNotFoundException();
    }
    await this.watchListRepository.deleteInterestPair(pairIdx, userIdx);

    return;
  }

  @Transactional()
  async updateInterestPairOrder(
    pairIdx: number,
    newOrder: number,
    userIdx: number,
  ): Promise<void> {
    const foundExistsPair =
      await this.watchListRepository.findInterestPairByIdx(pairIdx, userIdx);
    if (!foundExistsPair) {
      throw new CurrencyPairNotFoundException();
    }

    // Check item with the corresponding order
    const targetPair =
      await this.watchListRepository.findInterestPairWithOrderAndUser(
        newOrder,
        userIdx,
      );

    // When item exists
    if (targetPair) {
      // Replace order to exists order
      await this.watchListRepository.updateInterestPair(
        targetPair.idx,
        foundExistsPair.displayOrder,
        userIdx,
      );
    }

    await this.watchListRepository.updateInterestPair(
      pairIdx,
      newOrder,
      userIdx,
    );
  }
}
