import { Injectable } from '@nestjs/common';
import { IExchangeRateExternalAPI } from '../interfaces/exchange-rate-api.interface';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/config.type';
import { lastValueFrom } from 'rxjs';
import { IFrankFurter } from './interfaces/frankfurter-response.interface';
import {
  ILatestExchangeRateApi,
  ITimeSeriesData,
} from '../interfaces/exchange-rate-rest-api.interface';

@Injectable()
export class FrankFurterService
  implements ILatestExchangeRateApi, ITimeSeriesData
{
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
}
