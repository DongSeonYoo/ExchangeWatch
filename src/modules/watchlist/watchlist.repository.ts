import { Injectable } from '@nestjs/common';
import { IWatchList } from './interfaces/watch-list.interface';
import { WatchlistEntity } from './entitites/watch-list.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

@Injectable()
export class WatchListRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  async createInterestPair(
    input: IWatchList.ICreate,
  ): Promise<WatchlistEntity> {
    const result = await this.txHost.tx.watchlist.create({
      data: {
        userIdx: input.userIdx,
        baseCurrency: input.baseCurrency,
        currencyCode: input.currencyCode,
        displayOrder: input.displayOrder,
      },
    });

    return WatchlistEntity.from(result);
  }

  async findLastOrder(userIdx: number): Promise<number | undefined> {
    const lastOrder = await this.txHost.tx.watchlist.findFirst({
      select: {
        displayOrder: true,
      },
      where: {
        userIdx,
      },
      orderBy: {
        displayOrder: 'desc',
      },
    });

    return lastOrder?.displayOrder;
  }

  async findInterestPairByUser(
    userIdx: number,
    baseCurrency: string,
    currencyCode: string,
  ): Promise<WatchlistEntity | null> {
    const foundPair = await this.txHost.tx.watchlist.findFirst({
      where: {
        userIdx,
        baseCurrency,
        currencyCode,
      },
    });

    return foundPair ? WatchlistEntity.from(foundPair) : null;
  }

  async findInterestPairByIdx(
    currencyPair: number,
    userIdx: number,
  ): Promise<WatchlistEntity | null> {
    const foundPair = await this.txHost.tx.watchlist.findFirst({
      where: {
        idx: currencyPair,
        userIdx: userIdx,
      },
    });

    return foundPair ? WatchlistEntity.from(foundPair) : null;
  }

  async findInterestPairsWithCursor(input: {
    userIdx: number;
    limit: number;
    cursor?: number;
  }): Promise<{
    items: WatchlistEntity[];
    nextCursor?: number;
  }> {
    const items = await this.txHost.tx.watchlist.findMany({
      where: {
        userIdx: input.userIdx,
        ...(input.cursor && {
          displayOrder: {
            lt: input.cursor,
          },
        }),
      },
      orderBy: {
        displayOrder: 'desc',
      },
      take: input.limit + 1,
    });

    const hasNextPage = items.length > input.limit;
    if (hasNextPage) {
      items.pop(); // remove last data
    }

    return {
      items: items.map((item) => WatchlistEntity.from(item)),
      nextCursor: hasNextPage
        ? items[items.length - 1].displayOrder
        : undefined,
    };
  }

  async findInterestPairWithOrderAndUser(
    userIdx: number,
    order: number,
  ): Promise<WatchlistEntity | null> {
    const item = await this.txHost.tx.watchlist.findFirst({
      where: {
        userIdx,
        displayOrder: order,
      },
    });

    return item ? WatchlistEntity.from(item) : null;
  }

  async findInterestPairCountByUser(userIdx: number): Promise<number> {
    return await this.txHost.tx.watchlist.count({
      where: {
        userIdx,
      },
    });
  }

  async deleteInterestPair(pairIdx: number, userIdx: number): Promise<void> {
    await this.txHost.tx.watchlist.delete({
      where: {
        idx: pairIdx,
        userIdx: userIdx,
      },
    });

    return;
  }

  async updateInterestPair(
    pairIdx: number,
    newOrder: number,
    userIdx: number,
  ): Promise<void> {
    await this.txHost.tx.watchlist.update({
      data: {
        displayOrder: newOrder,
      },
      where: {
        idx: pairIdx,
        userIdx: userIdx,
      },
    });

    return;
  }
}
