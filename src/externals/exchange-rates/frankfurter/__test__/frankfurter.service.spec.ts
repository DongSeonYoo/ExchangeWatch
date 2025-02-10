import { HttpService } from '@nestjs/axios';
import { FrankFurterService } from '../frankfurter.service';
import { ConfigService } from '@nestjs/config';
import { instance, mock } from 'ts-mockito';
import { Test } from '@nestjs/testing';
import { TestConfigModule } from '../../../../../test/integration/modules/test-config.module';

describe('FrankfurterService', () => {
  let frankFurterService: FrankFurterService;
  let httpService: HttpService;
  let configService = mock(ConfigService);

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [TestConfigModule],
      providers: [
        FrankFurterService,
        {
          provide: HttpService,
          useFactory: () => {
            return {
              get: jest.fn(),
            };
          },
        },
        {
          provide: ConfigService,
          useValue: instance(configService),
        },
      ],
    }).compile();

    httpService = module.get(HttpService);
    frankFurterService = module.get(FrankFurterService);
    configService = module.get(ConfigService);
  });

  it('should defined frankfurter service', () => {
    expect(frankFurterService).toBeDefined();
  });
});
