import { Module } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { WatchlistController } from './watchlist.controller';
import { WatchListRepository } from './watchlist.repository';

@Module({
  controllers: [WatchlistController],
  providers: [WatchlistService, WatchListRepository],
})
export class WatchlistModule {}
