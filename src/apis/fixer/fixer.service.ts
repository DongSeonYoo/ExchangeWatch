import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

interface FixerResponse {
  success: boolean;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

@Injectable()
export class FixerService {
  private readonly fixerApiKey: string;
  private readonly fixerApiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.fixerApiKey = configService.get<string>('FIXER_API_KEY') as string;
    this.fixerApiUrl = configService.get<string>('FIXER_API_URL') as string;
  }

  // async getLatestRates(base: string, symbols: string[]) {
  //   const { data } = this.httpService.get<FixerResponse>(
  //     `${this.fixerApiUrl}/latest?access_key=${this.fixerApiKey}&base=${base}&symbols=${symbols.join(',')}`,
  //   );
  // }
}
