import { Injectable } from '@nestjs/common';
import { IExchangeRateAPIService } from '../../interfaces/exchange-rate-api-service';
import { IExchangeRateExternalAPI } from '../../interfaces/exchange-rate-api.interface';
import {
  mockCurrencyLayerHistoricalRatesFn,
  mockCurrencyLayerLatestRatesFn,
  mockCurrencyLayerTimeFrameRatesFn,
} from './currencylayer.mock';

@Injectable()
export class MockCurrencyLayerService implements IExchangeRateAPIService {
  constructor() {}
  async getLatestRates(
    baseCurrency: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.ILatestRatesResponse> {
    const result = await mockCurrencyLayerLatestRatesFn(
      baseCurrency,
      currencyCodes,
    );

    return {
      baseCurrency: result.source,
      date: new Date(result.timestamp * 1000),
      rates: result.quotes,
    };
  }

  async getHistoricalRates(
    date: Date,
    baseCurrency: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.IHistoricalResponse> {
    const result = await mockCurrencyLayerHistoricalRatesFn(
      date,
      baseCurrency,
      currencyCodes,
    );
    return {
      baseCurrency: result.source,
      date: result.date,
      rates: result.quotes,
    };
  }

  async getFluctuationData(
    startDate: Date,
    endDate: Date,
    baseCurrency: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.IFluctuationResponse> {
    const result = await mockCurrencyLayerTimeFrameRatesFn(
      startDate,
      endDate,
      baseCurrency,
      currencyCodes,
    );
    const fluctuationRates = computeFluctuation(result.quotes, result.source);
    return {
      baseCurrency: result.source,
      startDate: result.start_date,
      endDate: result.end_date,
      rates: fluctuationRates,
    };
  }

  async getTimeSeriesData(
    startDate: Date,
    endDate: Date,
    baseCurrency: string,
    currencyCodes?: string[],
  ): Promise<IExchangeRateExternalAPI.ITimeSeriesResponse> {
    const result = await mockCurrencyLayerTimeFrameRatesFn(
      startDate,
      endDate,
      baseCurrency,
      currencyCodes,
    );
    return {
      baseCurrency: result.source,
      startDate: result.start_date,
      endDate: result.end_date,
      rates: result.quotes,
    };
  }
}

/**
 * time‑series 데이터(ITimeFrameRates)의 quotes를 받아서
 * 각 통화에 대해 첫날과 마지막날의 값을 비교하여 fluctuation 정보를 계산
 */
function computeFluctuation(
  quotes: Record<string, Record<string, number>>,
  base: string,
): Record<string, IExchangeRateExternalAPI.TFluctuation> {
  const dates = Object.keys(quotes).sort(); // 오름차순 정렬
  if (dates.length === 0) {
    return {};
  }
  const firstDay = quotes[dates[0]];
  const lastDay = quotes[dates[dates.length - 1]];
  const fluctuation: Record<string, IExchangeRateExternalAPI.TFluctuation> = {};

  // firstDay의 각 키는 "EURUSD" 형태이므로 base를 제거하여 대상 통화 추출
  Object.entries(firstDay).forEach(([pair, startRate]) => {
    const currency = pair.replace(base, '');
    const endRate = lastDay[pair];
    const change = endRate - startRate;
    const changePct = startRate !== 0 ? change / startRate : 0;
    fluctuation[currency] = { startRate, endRate, change, changePct };
  });
  return fluctuation;
}
