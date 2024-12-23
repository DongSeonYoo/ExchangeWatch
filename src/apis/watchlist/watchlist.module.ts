import { Module } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { WatchlistController } from './watchlist.controller';

@Module({
  controllers: [WatchlistController],
  providers: [WatchlistService],
})
export class WatchlistModule {}
