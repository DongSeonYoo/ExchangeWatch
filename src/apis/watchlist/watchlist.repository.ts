// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../../prisma/prisma.service';
// import { IWatchList } from './interfaces/watch-list.interface';
// import { Prisma } from '@prisma/client';
// import { WatchlistEntity } from './entitites/watch-list.entity';

// @Injectable()
// export class WatchListRepository {
//   constructor(private readonly prisma: PrismaService) {}

//   async insertCurrency(
//     input: IWatchList.ICreate,
//     tx?: Prisma.TransactionClient,
//   ): Promise {
//     return await (tx ?? this.prisma).watchlist
//       .create({
//         data: {
//           userIdx: input.userIdx,
//           baseCurrency: input.baseCurrency,
//           currencyCode: input.currencyCode,
//           displayOrder: input.displayOrder,
//         },
//       })
//       .then((e) => WatchlistEntity.from(e));
//   }

//   async findLastOrder(
//     userIdx: number,
//     tx?: Prisma.TransactionClient,
//   ): Promise {
//     const lastOrder = await (tx ?? this.prisma).watchlist.findFirst({
//       select: {
//         displayOrder: true,
//       },
//       where: {
//         userIdx,
//       },
//       orderBy: {
//         displayOrder: 'desc',
//       },
//     });

//     return lastOrder?.displayOrder;
//   }

//   async findCurrencyPair(
//     userIdx: number,
//     baseCurrency: string,
//     currencyCode: string,
//   ): Promise {
//     return await this.prisma.watchlist
//       .findFirst({
//         where: {
//           userIdx,
//           baseCurrency,
//           currencyCode,
//         },
//       })
//       .then((e) => (e ? WatchlistEntity.from(e) : null));
//   }

//   async findInterestPair(
//     currencyPair: number,
//     userIdx: number,
//   ): Promise {
//     const foundPair = await this.prisma.watchlist.findFirst({
//       where: {
//         idx: currencyPair,
//         userIdx: userIdx,
//       },
//     });

//     return foundPair ? WatchlistEntity.from(foundPair) : null;
//   }

//   async findInterestPairsWithCursor(input: {
//     userIdx: number;
//     limit: number;
//     cursor?: number;
//   }): Promise<{
//     items: WatchlistEntity[];
//     nextCursor?: number;
//   }> {
//     const items = await this.prisma.watchlist.findMany({
//       where: {
//         userIdx: input.userIdx,
//         ...(input.cursor && {
//           displayOrder: {
//             lt: input.cursor,
//           },
//         }),
//       },
//       orderBy: {
//         displayOrder: 'desc',
//       },
//       take: input.limit + 1,
//     });

//     const hasNextPage = items.length > input.limit;
//     if (hasNextPage) {
//       items.pop(); // remove last data
//     }

//     return {
//       items: items.map((item) => WatchlistEntity.from(item)),
//       nextCursor: hasNextPage
//         ? items[items.length - 1].displayOrder
//         : undefined,
//     };
//   }

//   async findInterestPairWithOrderAndUser(
//     userIdx: number,
//     order: number,
//     tx?: Prisma.TransactionClient,
//   ): Promise {
//     const item = await (tx ?? this.prisma).watchlist.findFirst({
//       where: {
//         userIdx,
//         displayOrder: order,
//       },
//     });

//     return item ? WatchlistEntity.from(item) : null;
//   }

//   async findInterestPairCountWithUser(userIdx: number): Promise {
//     return await this.prisma.watchlist.count({
//       where: {
//         userIdx,
//       },
//     });
//   }

//   async deleteInterestPair(
//     pairIdx: number,
//     userIdx: number,
//     tx?: Prisma.TransactionClient,
//   ): Promise {
//     await (tx ?? this.prisma).watchlist.delete({
//       where: {
//         idx: pairIdx,
//         userIdx: userIdx,
//       },
//     });

//     return;
//   }

//   async updateInterestPair(
//     pairIdx: number,
//     newOrder: number,
//     userIdx: number,
//     tx?: Prisma.TransactionClient,
//   ): Promise {
//     await (tx ?? this.prisma).watchlist.update({
//       data: {
//         displayOrder: newOrder,
//       },
//       where: {
//         idx: pairIdx,
//         userIdx: userIdx,
//       },
//     });

//     return;
//   }
// }

// import { Injectable } from '@nestjs/common';
// import { WatchListRepository } from './watchlist.repository';
// import { TransactionManager } from '../../prisma/prisma-transaction.manager';
// import { AddWatchlistItemReqDto } from './dto/add-watchlist-item.dto';
// import { WatchlistEntity } from './entitites/watch-list.entity';
// import { AlreadyRegisterPairException } from './exceptions/already-register-pair.excepetion';
// import { MaximumPairException } from './exceptions/maximum-pair.exception';
// import { SelectWatchListReqDto } from './dto/select-watchlis.dto';
// import { CurrencyPairNotFoundException } from './exceptions/currency-pair-not-found.exception';

// @Injectable()
// export class WatchlistService {
//   private readonly MAX_PAIR_COUNT = 10;
//   constructor(
//     private readonly watchListRepository: WatchListRepository,
//     private readonly txManager: TransactionManager,
//   ) {}

//   async createInterestCurrency(
//     userIdx: number,
//     dto: AddWatchlistItemReqDto,
//   ): Promise {
//     // 1. Check AlreadyRegisterPairException
//     const checkRegisterPair = await this.watchListRepository.findCurrencyPair(
//       userIdx,
//       dto.baseCurrency,
//       dto.currencyCode,
//     );
//     if (checkRegisterPair) {
//       throw new AlreadyRegisterPairException();
//     }

//     // 2. Check MaximumPairException
//     const pairCount =
//       await this.watchListRepository.findInterestPairCountWithUser(userIdx);
//     if (pairCount >= this.MAX_PAIR_COUNT) {
//       throw new MaximumPairException();
//     }

//     // Start Transactions
//     const createdItem = this.txManager.runTransaction(async (tx) => {
//       const lastOrder = await this.watchListRepository.findLastOrder(
//         userIdx,
//         tx,
//       );
//       const displayOrder = lastOrder === undefined ? 0 : lastOrder + 1;

//       return await this.watchListRepository.insertCurrency(
//         {
//           userIdx: userIdx,
//           baseCurrency: dto.baseCurrency,
//           currencyCode: dto.currencyCode,
//           displayOrder: displayOrder,
//         },
//         tx,
//       );
//     });

//     return createdItem;
//   }

//   async getInterestCurrencyList(
//     userIdx: number,
//     dto: SelectWatchListReqDto,
//   ): Promise<{ items: WatchlistEntity[]; nextCursor: number | undefined }> {
//     const data = await this.watchListRepository.findInterestPairsWithCursor({
//       userIdx,
//       cursor: dto.cursor,
//       limit: dto.limit,
//     });

//     return {
//       items: data.items,
//       nextCursor: data.nextCursor,
//     };
//   }

//   async deleteInterstCurrency(pairIdx: number, userIdx: number): Promise {
//     const foundExistPair = await this.watchListRepository.findInterestPair(
//       pairIdx,
//       userIdx,
//     );
//     if (!foundExistPair) {
//       throw new CurrencyPairNotFoundException();
//     }
//     await this.watchListRepository.deleteInterestPair(pairIdx, userIdx);

//     return;
//   }

//   async updateInterestPair(
//     pairIdx: number,
//     newOrder: number,
//     userIdx: number,
//   ): Promise {
//     const foundExistsPair = await this.watchListRepository.findInterestPair(
//       pairIdx,
//       userIdx,
//     );
//     if (!foundExistsPair) {
//       throw new CurrencyPairNotFoundException();
//     }

//     await this.txManager.runTransaction(async (tx) => {
//       // Check item with the corresponding order
//       const targetPair =
//         await this.watchListRepository.findInterestPairWithOrderAndUser(
//           newOrder,
//           userIdx,
//           tx,
//         );

//       // When item exists
//       if (targetPair) {
//         // Replace order to exists order
//         await this.watchListRepository.updateInterestPair(
//           targetPair.idx,
//           foundExistsPair.displayOrder,
//           userIdx,
//           tx,
//         );
//       }

//       await this.watchListRepository.updateInterestPair(
//         pairIdx,
//         newOrder,
//         userIdx,
//         tx,
//       );
//     });
//   }
// }

// 이거 repository메서드 이름 일관성 있게 바꿔줘, 그리고 지금 findInterestPair랑 findCurrencyPair 이거 둘이 로직 같은거같은데 하나만 사용하게
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IWatchList } from './interfaces/watch-list.interface';
import { Prisma } from '@prisma/client';
import { WatchlistEntity } from './entitites/watch-list.entity';

@Injectable()
export class WatchListRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createInterestPair(
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

  async findInterestPairByUser(
    userIdx: number,
    baseCurrency: string,
    currencyCode: string,
  ): Promise<WatchlistEntity | null> {
    const foundPair = await this.prisma.watchlist.findFirst({
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
    const foundPair = await this.prisma.watchlist.findFirst({
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

  async findInterestPairWithOrderAndUser(
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

  async findInterestPairCountByUser(userIdx: number): Promise<number> {
    return await this.prisma.watchlist.count({
      where: {
        userIdx,
      },
    });
  }

  async deleteInterestPair(
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
