import { Injectable } from '@nestjs/common';
import { IExchangeRateRestAPIService } from '../interfaces/exchange-rate-rest-api.interface';
import { IExchangeRateExternalAPI } from '../interfaces/exchange-rate-api.interface';
import {
  mockFluctuationRatesFn,
  mockHistoricalRatesFn,
  mockLatestRatesFn,
} from '../fixer/mock/fixer-mock.constant';

@Injectable()
export class MockFixerService implements IExchangeRateRestAPIService {
  async getLatestRates(
    baseCurrency?: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.ILatestRatesResponse> {
    const data = await mockLatestRatesFn(baseCurrency, currencyCodes);

    return {
      baseCurrency: data.base,
      date: data.date,
      rates: data.rates,
    };
  }

  async getFluctuationData(
    startDate: Date,
    endDate: Date,
    baseCurrency?: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.IFluctuationResponse> {
    const data = await mockFluctuationRatesFn(
      startDate,
      endDate,
      baseCurrency,
      currencyCodes,
    );

    return {
      baseCurrency: data.base,
      startDate: data.start_date,
      endDate: data.end_date,
      rates: Object.entries(data.rates).reduce((acc, [currency, rate]) => {
        acc[currency] = {
          startRate: rate.start_rate,
          endRate: rate.end_rate,
          change: rate.change,
          changePct: rate.change_pct,
        };
        return acc;
      }, {}),
    };
  }

  async getHistoricalRates(
    date: Date,
    baseCurrency?: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.IHistoricalResponse> {
    const data = await mockHistoricalRatesFn(date, baseCurrency, currencyCodes);

    return {
      baseCurrency: data.base,
      date: data.date,
      rates: data.rates,
    };
  }

  async getTimeSeriesData(
    startDate: Date,
    endDate: Date,
    baseCurrency?: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.ITimeSeriesResponse> {
    throw new Error();
  }
}
