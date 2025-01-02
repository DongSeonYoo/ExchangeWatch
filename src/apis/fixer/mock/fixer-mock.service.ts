import { Injectable } from '@nestjs/common';
import {
  MOCK_FLUCTUATION_RATES,
  MOCK_HISTORICAL_RATES,
  MOCK_LATEST_RATES,
} from './fixer-mock.constant';
import { IFixerAPIResponse } from '../../exchange-rate/interface/fixer-api.response';
import { ICurrencyService } from '../../exchange-rate/interface/currency.service.interface';

@Injectable()
export class MockFixerService implements ICurrencyService {
  getLatestRates(
    base?: string,
    symbols?: string[],
  ): Promise<IFixerAPIResponse.IRateResponse> {
    return Promise.resolve(MOCK_LATEST_RATES);
  }

  getHistoricalRates(
    date: string,
    base?: string,
    symbols?: string[],
  ): Promise<IFixerAPIResponse.IHistoricalResponse> {
    return Promise.resolve(MOCK_HISTORICAL_RATES);
  }

  getFluctuationRates(
    start_date: Date,
    end_date: Date,
    base?: string,
    symbols?: string[],
  ): Promise<IFixerAPIResponse.IFluctuationResponse> {
    return Promise.resolve(MOCK_FLUCTUATION_RATES);
  }
}
