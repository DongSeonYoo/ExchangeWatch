import { Injectable } from '@nestjs/common';
import {
  mockFluctuationRatesFn,
  mockHistoricalRatesFn,
  mockLatestRatesFn,
} from './fixer-mock.constant';
import { IFixerAPIResponse } from '../interfaces/fixer-api.response';
import { IFixerService } from '../interfaces/fixer-service.interface';

@Injectable()
export class MockFixerService implements IFixerService {
  getLatestRates(
    base?: string,
    symbols?: string[],
  ): Promise<IFixerAPIResponse.IRateResponse> {
    return Promise.resolve(mockLatestRatesFn(base, symbols));
  }

  getHistoricalRates(
    date: Date,
    base?: string,
    symbols?: string[],
  ): Promise<IFixerAPIResponse.IHistoricalResponse> {
    return Promise.resolve(mockHistoricalRatesFn(date, base, symbols));
  }

  getFluctuationRates(
    start_date: Date,
    end_date: Date,
    base?: string,
    symbols?: string[],
  ): Promise<IFixerAPIResponse.IFluctuationResponse> {
    return Promise.resolve(
      mockFluctuationRatesFn(start_date, end_date, base, symbols),
    );
  }
}
