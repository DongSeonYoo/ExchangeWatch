import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AppConfig } from '../../../config/config.type';
import { IExchangeRateExternalAPI } from '../interfaces/exchange-rate-api.interface';
import {
  IExchangeRateRestAPIService,
  IFluctuationExchangeRateApi,
  ILatestExchangeRateApi,
} from '../interfaces/exchange-rate-rest-api.interface';
import { IFixerAPIResponse } from './interfaces/fixer-response.interface';

@Injectable()
export class FixerService
  implements ILatestExchangeRateApi, IFluctuationExchangeRateApi
{
  private readonly fixerApiKey: string;
  private readonly fixerApiUrl: string;
  private readonly logger = new Logger(FixerService.name);

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly httpService: HttpService,
  ) {
    this.fixerApiKey = configService.get('fixer.apiKey', { infer: true });
    this.fixerApiUrl = configService.get('fixer.apiUrl', { infer: true });
  }

  async getLatestRates(
    baseCurrency?: string,
    currencyCodes: string[] = [],
  ): Promise<IExchangeRateExternalAPI.ILatestRatesResponse> {
    return lastValueFrom(
      this.httpService.get<IFixerAPIResponse.IRateResponse>(
        `${this.fixerApiUrl}/latest?access_key=${this.fixerApiKey}&base=${baseCurrency}&symbols=${currencyCodes.join(',')}`,
      ),
    ).then(({ data }) => ({
      baseCurrency: data.base,
      date: data.date,
      rates: data.rates,
    }));
  }

  async getFluctuationData(
    startDate: Date,
    endDate: Date,
    baseCurrency?: string,
    currencyCodes: string[] = [],
  ): Promise<IExchangeRateExternalAPI.IFluctuationResponse> {
    const convertStartDate = startDate.toISOString().split('T')[0];
    const convertEndDate = endDate.toISOString().split('T')[0];

    return lastValueFrom(
      this.httpService.get<IFixerAPIResponse.IFluctuationResponse>(
        `${this.fixerApiUrl}/fluctuation?access_key=${this.fixerApiKey}&start_date=${convertStartDate}&end_date=${convertEndDate}&base=${baseCurrency}&symbols=${currencyCodes.join(',')}`,
      ),
    ).then(({ data }) => {
      if (!data.success) {
        const { error } = data as unknown as IFixerAPIResponse.IErrorResponse;
        console.log(error);
        throw new Error('');
      }

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
    });
  }
}
