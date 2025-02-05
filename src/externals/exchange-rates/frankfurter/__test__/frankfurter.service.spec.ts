import { HttpService } from '@nestjs/axios';
import { FrankFurterService } from '../frankfurter.service';
import { ConfigService } from '@nestjs/config';
import { instance, mock, when } from 'ts-mockito';
import { Test } from '@nestjs/testing';
import { IFrankFurter } from '../interfaces/frankfurter-response.interface';
import { of } from 'rxjs';

describe('FrankfurterService', () => {
  let frankFurterService: FrankFurterService;
  let httpService = mock(HttpService);
  let configService = mock(ConfigService);

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FrankFurterService,
        {
          provide: HttpService,
          useValue: instance(httpService),
        },
        {
          provide: ConfigService,
          useValue: instance(configService),
        },
      ],
    }).compile();

    frankFurterService = module.get<FrankFurterService>(FrankFurterService);
    console.log(frankFurterService);
  });

  it('should defined frankfurter service', () => {
    expect(frankFurterService).toBeDefined();
  });

  describe('getLatestRates', () => {
    it('should return latest rates', async () => {
      // Arrange
      const params = {
        base: 'EUR',
        symbols: ['USD, JPY'],
      };
      const mockResponse: IFrankFurter.ILatestRates = {
        base: 'EUR',
        date: new Date('2025-02-05'),
        rates: { USD: 1.0424, JPY: 156 },
      };

      when(
        httpService.get('http://test/latest', {
          params: params,
        }),
      ).thenReturn(of({ data: mockResponse }) as any);

      // Act
      const result = await frankFurterService.getLatestRates(
        params.base,
        params.symbols,
      );
      console.log(result);

      // Assert
    });
  });
});
