import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/config.type';
import { HttpService } from '@nestjs/axios';
import { IExchangeRateExternalAPI } from '../interfaces/exchange-rate-api.interface';
import {
  IFluctuationExchangeRateApi,
  ILatestExchangeRateApi,
} from '../interfaces/exchange-rate-rest-api.interface';
import { ICoinApiResponse } from './interfaces/coin-api-response.interface';
import { supportCurrencyList } from '../../../../modules/exchange-rate/constants/support-currency.constant';

@Injectable()
export class CoinApiService
  implements ILatestExchangeRateApi, IFluctuationExchangeRateApi
{
  private readonly apiUrl: string;
  private readonly logger = new Logger(CoinApiService.name);

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly httpService: HttpService,
  ) {
    this.apiUrl = this.configService.get('coinApi.baseUrl', { infer: true });
  }

  async getLatestRates(
    baseCurrency: string,
    currencyCodes: string[] = supportCurrencyList,
  ): Promise<IExchangeRateExternalAPI.ILatestRatesResponse> {
    if (currencyCodes.length === 0) {
      currencyCodes = supportCurrencyList;
    }
    const currencies = currencyCodes?.join(';');
    const url = `${this.apiUrl}/exchangerate/${baseCurrency}?filter_asset_id=${currencies};`;
    const { data, status, statusText } =
      await this.httpService.axiosRef.get<ICoinApiResponse.ICurrentRatesResponse>(
        url,
      );
    if (status !== HttpStatus.OK) {
      this.logger.error(statusText);
      throw new Error(statusText);
    }

    return {
      baseCurrency: data.asset_id_base,
      date: new Date(),
      rates: data.rates.reduce((acc, rateInfo) => {
        acc[rateInfo.asset_id_quote] = rateInfo.rate;
        return acc;
      }, {}),
    };
  }

  /**
   *
   */
  async getFluctuationData(
    startDate: Date,
    endDate: Date,
    baseCurrency: string,
    currencyCodes: string[] = [],
  ): Promise<IExchangeRateExternalAPI.IFluctuationResponse> {
    if (currencyCodes.length === 0) {
      currencyCodes = supportCurrencyList;
    }

    const [startDateString, endDateString] = this.formatDateToString(
      startDate,
      endDate,
    );
    const fluctuationResponses = await Promise.all(
      currencyCodes.map(async (currency) => {
        const url = `https://api-historical.exrates.coinapi.io/v1/exchangerate/${baseCurrency}/${currency}/history?period_id=1DAY&time_start=${startDateString}&time_end=${endDateString}`;

        const { data } =
          await this.httpService.axiosRef.get<
            ICoinApiResponse.IFluctuationResponse[]
          >(url);

        return {
          currency,
          rates: data.map((entry) => ({
            startRate: entry.rate_open,
            endRate: entry.rate_close,
            change: entry.rate_close - entry.rate_open,
            changePct:
              ((entry.rate_close - entry.rate_open) / entry.rate_open) * 100,
          })),
        };
      }),
    );

    const rates: IExchangeRateExternalAPI.IFluctuationResponse['rates'] = {};
    fluctuationResponses.forEach((response) => {
      rates[response.currency] = response.rates[0];
    });

    return {
      baseCurrency,
      startDate,
      endDate,
      rates,
    };
  }

  /**
   * Formats Date objects into 'YYYY-MM-DD' strings.
   *
   * @param dates - One or more Date objects.
   * @returns Array of date strings.
   */
  private formatDateToString(...dates: Date[]): string[] {
    return dates.map((date) => date.toISOString().split('T')[0]);
  }
}
