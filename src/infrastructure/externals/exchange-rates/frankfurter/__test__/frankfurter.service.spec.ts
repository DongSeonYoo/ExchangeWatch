import { HttpService } from '@nestjs/axios';
import { FrankFurterService } from '../frankfurter.service';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TestConfigModule } from '../../../../../../test/integration/modules/test-config.module';
import { MockProxy } from 'jest-mock-extended';
import mock from 'jest-mock-extended/lib/Mock';

describe('FrankfurterService', () => {
  let frankFurterService: FrankFurterService;
  let httpService: HttpService;
  let configService: MockProxy<ConfigService>;

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
          useValue: mock<ConfigService>(),
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
