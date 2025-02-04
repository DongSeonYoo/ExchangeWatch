import { Injectable } from '@nestjs/common';
import { IExchangeRateAPIService } from '../interfaces/exchange-rate-api-service';
import { IExchangeRateExternalAPI } from '../interfaces/exchange-rate-api.interface';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../configs/config.type';
import { lastValueFrom } from 'rxjs';
import { IFrankFurter } from './interfaces/frankfurter-response.interface';

@Injectable()
export class FrankFurterService implements IExchangeRateAPIService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {
    this.baseUrl = this.configService.get('frankFurter.baseUrl', {
      infer: true,
    });
  }

  async getLatestRates(
    baseCurrency?: string,
    currencyCodes: string[] = [],
  ): Promise<IExchangeRateExternalAPI.ILatestRatesResponse> {
    const { data } = await lastValueFrom(
      this.httpService.get<IFrankFurter.ILatestRates>(
        `${this.baseUrl}/latest${baseCurrency ? `?base=${baseCurrency}` : ''}${currencyCodes.length ? `&symbols=${currencyCodes.join(',')}` : ''}`,
      ),
    );

    return {
      baseCurrency: data.base,
      date: data.date,
      rates: data.rates,
    };
  }

  async getHistoricalRates(
    date: Date,
    baseCurrency?: string,
    currencyCodes: string[] = [],
  ): Promise<IExchangeRateExternalAPI.IHistoricalResponse> {
    const convertDate = date.toISOString().split('T')[0];

    const { data } = await lastValueFrom(
      this.httpService.get<IFrankFurter.IHistorical>(
        `${this.baseUrl}/${convertDate}${baseCurrency ? `?base=${baseCurrency}` : ''}${currencyCodes?.length ? `&symbols=${currencyCodes.join(',')}` : ''}`,
      ),
    );

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
    currencyCodes: string[] = [],
  ): Promise<IExchangeRateExternalAPI.ITimeSeriesResponse> {
    const convertStartDate = startDate.toISOString().split('T')[0];
    const convertEndDate = endDate.toISOString().split('T')[0];

    const { data } = await lastValueFrom(
      this.httpService.get<IFrankFurter.ITimeSeries>(
        `${this.baseUrl}/${convertStartDate}..${convertEndDate}${baseCurrency ? `?base=${baseCurrency}` : ''}${currencyCodes?.length ? `&symbols=${currencyCodes.join(',')}` : ''}`,
      ),
    );

    return {
      baseCurrency: data.base,
      startDate: data.start_date,
      endDate: data.end_date,
      rates: data.rates,
    };
  }

  async getOHLCData(
    startDate: Date,
    endDate: Date,
    baseCurrency?: string,
    currencyCodes: string[] = [],
  ): Promise<IExchangeRateExternalAPI.IFluctuationResponse> {
    const timeSeries = await this.getTimeSeriesData(
      startDate,
      endDate,
      baseCurrency,
      currencyCodes,
    );

    const rates = Object.entries(
      timeSeries.rates[Object.keys(timeSeries.rates)[0]],
    ).reduce<Record<string, IExchangeRateExternalAPI.TFluctuation>>(
      (acc, [currency]) => {
        const dates = Object.keys(timeSeries.rates);
        const startRate = timeSeries.rates[dates[0]][currency];
        const endRate = timeSeries.rates[dates[dates.length - 1]][currency];
        const change = endRate - startRate;

        acc[currency] = {
          startRate,
          endRate,
          change,
          changePct: (change / startRate) * 100,
        };

        return acc;
      },
      {},
    );

    return {
      baseCurrency: timeSeries.baseCurrency,
      startDate: timeSeries.startDate,
      endDate: timeSeries.endDate,
      rates,
    };
  }
}
