import { Module } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { WatchlistController } from './watchlist.controller';
import { WatchListRepository } from './watchlist.repository';
import { TransactionManager } from '../../prisma/prisma-transaction.manager';

@Module({
  controllers: [WatchlistController],
  providers: [WatchlistService, WatchListRepository, TransactionManager],
})
export class WatchlistModule {}
