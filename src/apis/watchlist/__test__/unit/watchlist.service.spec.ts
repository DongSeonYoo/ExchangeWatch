import { Test } from '@nestjs/testing';
import { WatchlistService } from '../../watchlist.service';
import { WatchListRepository } from '../../watchlist.repository';
import { anything, instance, mock, when } from 'ts-mockito';
import { TransactionManager } from '../../../../prisma/prisma-transaction.manager';

describe('WatchListService', () => {
  let watchListService: WatchlistService;
  let watchListRepository = mock(WatchListRepository);
  let transactionManager = mock(TransactionManager);

  beforeEach(async () => {
    when(transactionManager.runTransaction(anything())).thenCall(async (fn) =>
      Promise.resolve(fn()),
    );

    const module = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: WatchListRepository,
          useValue: instance(watchListRepository),
        },
        {
          provide: TransactionManager,
          useValue: instance(transactionManager),
        },
      ],
    }).compile();

    watchListService = module.get(WatchlistService);
  });

  it('should be defined', () => {
    expect(watchListService).toBeDefined();
  });
});
