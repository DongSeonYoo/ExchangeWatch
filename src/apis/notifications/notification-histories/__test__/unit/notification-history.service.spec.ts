import { Test } from '@nestjs/testing';
import { NotificationHistoryService } from '../../notification-history.service';
import { NotificationHistoryRepository } from '../../repository/notification-history.repository';
import { mock, MockProxy } from 'jest-mock-extended';

describe('NotificationHistoryService (unit)', () => {
  let notificationHistoryService: NotificationHistoryService;
  let notificationHistoryRepository: MockProxy<NotificationHistoryRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificationHistoryService,
        {
          provide: NotificationHistoryRepository,
          useFactory: () => mock<NotificationHistoryRepository>(),
        },
      ],
    }).compile();

    notificationHistoryService = module.get(NotificationHistoryService);
    notificationHistoryRepository = module.get(NotificationHistoryRepository);
  });

  it('should be defined', () => {
    expect(notificationHistoryService).toBeDefined();
    expect(notificationHistoryRepository).toBeDefined();
  });
});
