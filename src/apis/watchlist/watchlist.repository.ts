import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IWatchList } from './interfaces/watch-list.interface';
import { Prisma } from '@prisma/client';
import { WatchlistEntity } from './entitites/watch-list.entity';

@Injectable()
export class WatchListRepository {
  constructor(private readonly prisma: PrismaService) {}

  async insertCurrency(
    input: IWatchList.ICreate,
    tx?: Prisma.TransactionClient,
  ): Promise<WatchlistEntity> {
    return await (tx ?? this.prisma).watchlist
      .create({
        data: {
          userIdx: input.userIdx,
          baseCurrency: input.baseCurrency,
          currencyCode: input.currencyCode,
          displayOrder: input.displayOrder,
        },
      })
      .then((e) => WatchlistEntity.from(e));
  }

  async findLastOrder(
    userIdx: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number | undefined> {
    const lastOrder = await (tx ?? this.prisma).watchlist.findFirst({
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

  async findCurrencyPair(
    userIdx: number,
    baseCurrency: string,
    currencyCode: string,
  ): Promise<WatchlistEntity | null> {
    return await this.prisma.watchlist
      .findFirst({
        where: {
          userIdx,
          baseCurrency,
          currencyCode,
        },
      })
      .then((e) => (e ? WatchlistEntity.from(e) : null));
  }

  async findCurrencyPairWithUser(
    currencyPair: number,
    userIdx: number,
  ): Promise<WatchlistEntity | null> {
    const foundPair = await this.prisma.watchlist.findFirst({
      where: {
        idx: currencyPair,
        userIdx: userIdx,
      },
    });

    return foundPair ? WatchlistEntity.from(foundPair) : null;
  }

  async findUserWatchListsWithCursor(input: {
    userIdx: number;
    limit: number;
    cursor?: number;
  }): Promise<{
    items: WatchlistEntity[];
    nextCursor?: number;
  }> {
    const items = await this.prisma.watchlist.findMany({
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

  async findCurrencyPairWithOrderAndUser(
    userIdx: number,
    order: number,
    tx?: Prisma.TransactionClient,
  ): Promise<WatchlistEntity | null> {
    const item = await (tx ?? this.prisma).watchlist.findFirst({
      where: {
        userIdx,
        displayOrder: order,
      },
    });

    return item ? WatchlistEntity.from(item) : null;
  }

  async countUserPairs(userIdx: number): Promise<number> {
    return await this.prisma.watchlist.count({
      where: {
        userIdx,
      },
    });
  }

  async deleteCurrencyPair(
    pairIdx: number,
    userIdx: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await (tx ?? this.prisma).watchlist.delete({
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
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await (tx ?? this.prisma).watchlist.update({
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
