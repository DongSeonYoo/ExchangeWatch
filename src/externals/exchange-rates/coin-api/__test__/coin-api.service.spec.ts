import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CoinApiService } from '../coin-api.service';
import { HttpService } from '@nestjs/axios';
import { mock, MockProxy } from 'jest-mock-extended';

describe('CoinApiService (unit, external)', () => {
  let coinApiService: MockProxy<CoinApiService>;
  let httpService: MockProxy<HttpService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CoinApiService,
        {
          provide: ConfigService,
          useFactory: () => mock<CoinApiService>(),
        },
        {
          provide: HttpService,
          useFactory: () => mock<HttpService>(),
        },
      ],
    }).compile();

    coinApiService = module.get(CoinApiService);
    httpService = module.get(HttpService);
  });

  it('Should be definded', () => {
    expect(coinApiService).toBeDefined();
  });

  describe('getLatestRates', () => {
    it('should return latest exchange rates', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
