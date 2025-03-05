import { Injectable } from '@nestjs/common';
import { IExchangeRateRestAPIService } from '../../interfaces/exchange-rate-rest-api.interface';
import { IExchangeRateExternalAPI } from '../../interfaces/exchange-rate-api.interface';
import * as mockCurrencyLayer from '../constant/currencylayer.constant';
import { CurrencyLayerService } from '../currencylayer.service';

@Injectable()
export class MockCurrencyLayerService
  extends CurrencyLayerService
  implements IExchangeRateRestAPIService
{
  async getLatestRates(
    baseCurrency: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.ILatestRatesResponse> {
    const result = await mockCurrencyLayer.mockLatestRateFn(
      baseCurrency,
      currencyCodes,
    );

    return {
      baseCurrency: result.source,
      date: new Date(result.timestamp * 1000),
      rates: this.parseRealTimeQuotes(result.source, result.quotes),
    };
  }

  async getFluctuationData(
    startDate: Date,
    endDate: Date,
    baseCurrency: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.IFluctuationResponse> {
    const result = await mockCurrencyLayer.mockFluctuationRatesFn(
      startDate,
      endDate,
      baseCurrency,
      currencyCodes,
    );

    return {
      baseCurrency: result.source,
      startDate: result.start_date,
      endDate: result.end_date,
      rates: this.parseFluctuationQuotes(result.source, result.quotes),
    };
  }

  async getTimeSeriesData(
    startDate: Date,
    endDate: Date,
    baseCurrency: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.ITimeSeriesResponse> {
    const result = await mockCurrencyLayer.mockTimeSeriesRateFn(
      startDate,
      endDate,
      baseCurrency,
      currencyCodes,
    );

    return {
      baseCurrency: result.source,
      startDate: result.start_date,
      endDate: result.end_date,
      rates: this.parseTimeSeriesQuotes(result.source, result.quotes),
    };
  }

  async getHistoricalRates(
    date: Date,
    baseCurrency: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.IHistoricalResponse> {
    const result = await mockCurrencyLayer.mockHistoricalRateFn(
      date,
      baseCurrency,
      currencyCodes,
    );

    return {
      baseCurrency: result.source,
      date: result.date,
      rates: this.parseRealTimeQuotes(result.source, result.quotes),
    };
  }
}
