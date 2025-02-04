import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IFrankfurterService } from './interfaces/frankfurter-service.interface';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../configs/config.type';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { IFrankFurter } from './interfaces/frankfurter.interface';

@Injectable()
export class FrankFurterService implements IFrankfurterService {
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {
    this.baseUrl = this.configService.get('frankFurter.baseUrl', {
      infer: true,
    });
  }

  async getLatestRates(
    base?: string,
    symbols?: string[],
  ): Promise<IFrankFurter.ILatestRates> {
    let url = `${this.baseUrl}/latest`;

    const params = new URLSearchParams();
    if (base) {
      params.append('base', base);
    }
    if (symbols?.length) {
      params.append('symbols', symbols.join(','));
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const { data } = await lastValueFrom(
      this.httpService.get<IFrankFurter.ILatestRates>(url),
    );

    return {
      ...data,
      date: new Date(data.date),
    };
  }

  async getHistoricalRates(
    date: Date,
    base?: string,
    symbols?: string[],
  ): Promise<IFrankFurter.IHistorical> {
    const convertDate = date.toISOString().split('T')[0];
    let url = `${this.baseUrl}/${convertDate}`;

    const params = new URLSearchParams();
    if (base) {
      params.append('base', base);
    }
    if (symbols?.length) {
      params.append('symbols', symbols.join(','));
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const { data } = await lastValueFrom(
      this.httpService.get<IFrankFurter.IHistorical>(url),
    );

    return {
      ...data,
      date: new Date(data.date),
    };
  }

  async getTimeSeriesRates(
    startDate: Date,
    endDate: Date,
    base?: string,
    symbols?: string[],
  ): Promise<IFrankFurter.ITimeSeries> {
    const convertStartDate = startDate.toISOString().split('T')[0];
    const convertEndDate = endDate.toISOString().split('T')[0];

    let url = `${this.baseUrl}/${convertStartDate}..${convertEndDate}`;

    const params = new URLSearchParams();
    if (base) {
      params.append('base', base);
    }
    if (symbols?.length) {
      params.append('symbols', symbols.join(','));
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const { data } = await lastValueFrom(
      this.httpService.get<IFrankFurter.ITimeSeries>(url),
    );

    return {
      ...data,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
    };
  }

  async getFluctuationRates(
    startDate: Date,
    endDate: Date,
    base?: string,
    symbols?: string[],
  ): Promise<IFrankFurter.IFluctuationResponse> {
    const timeSeries = await this.getTimeSeriesRates(
      startDate,
      endDate,
      base,
      symbols,
    );

    const rates: Record<string, IFrankFurter.TFluctuation> = {};
    const currencies = Object.keys(
      timeSeries.rates[Object.keys(timeSeries.rates)[0]],
    );

    currencies.forEach((currency) => {
      const dates = Object.keys(timeSeries.rates);
      const startRate = timeSeries.rates[dates[0]][currency];
      const endRate = timeSeries.rates[dates[dates.length - 1]][currency];
      const change = endRate - startRate;
      const change_pct = (change / startRate) * 100;

      rates[currency] = {
        start_rate: startRate,
        end_rate: endRate,
        change,
        change_pct,
      };
    });

    return {
      base: timeSeries.base,
      start_date: new Date(timeSeries.start_date),
      end_date: new Date(timeSeries.end_date),
      rates,
    };
  }
}
