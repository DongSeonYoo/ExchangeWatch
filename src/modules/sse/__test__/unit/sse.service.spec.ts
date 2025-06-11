import { Test, TestingModule } from '@nestjs/testing';
import { LatestRateSseService } from '../../services/latest-rate-sse.service';
import { CustomLoggerService } from '../../../../common/logger/custom-logger.service';
import { mock, MockProxy } from 'jest-mock-extended';
import typia from 'typia';
import { Observable, Subject } from 'rxjs';

describe('LatestRateSSEService [unit]', () => {
  const subjectPrefix = 'latest-rate:';
  let sseService: LatestRateSseService;
  let loggerService: MockProxy<CustomLoggerService>;

  beforeEach(async () => {
    loggerService = mock<CustomLoggerService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LatestRateSseService,
        {
          provide: CustomLoggerService,
          useValue: loggerService,
        },
      ],
    }).compile();

    sseService = module.get(LatestRateSseService);
    loggerService = module.get(CustomLoggerService);
  });

  it('should be defined', () => {
    expect(sseService).toBeDefined();
    expect(loggerService).toBeDefined();
  });
});
