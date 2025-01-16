import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { IFixerAPIResponse } from './interfaces/fixer-api.response';
import { IFixerService } from './interfaces/fixer-service.interface';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class FixerService implements IFixerService {
  private readonly fixerApiKey: string;
  private readonly fixerApiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.fixerApiKey = configService.get<string>('FIXER_API_KEY') as string;
    this.fixerApiUrl = configService.get<string>('FIXER_API_URL') as string;
  }

  async getLatestRates(
    base?: string,
    symbols: string[] = [],
  ): Promise<IFixerAPIResponse.IRateResponse> {
    return lastValueFrom(
      this.httpService.get<IFixerAPIResponse.IRateResponse>(
        `${this.fixerApiUrl}/latest?access_key=${this.fixerApiKey}&base=${base}&symbols=${symbols.join(',')}`,
      ),
    ).then(({ data }) => data);
  }

  async getFluctuationRates(
    start_date: Date,
    end_date: Date,
    base?: string,
    symbols: string[] = [],
  ): Promise<IFixerAPIResponse.IFluctuationResponse> {
    return lastValueFrom(
      this.httpService.get<IFixerAPIResponse.IFluctuationResponse>(
        `${this.fixerApiUrl}/fluctuation?access_key=${this.fixerApiKey}&start_date=${start_date.toISOString()}&end_date=${end_date.toISOString()}&base=${base}&symbols=${symbols.join(',')}`,
      ),
    ).then(({ data }) => data);
  }

  getHistoricalRates(
    date: string,
    base?: string,
    symbols?: string[],
  ): Promise<IFixerAPIResponse.IHistoricalResponse> {
    throw new Error('Method not implemented.');
  }
}
