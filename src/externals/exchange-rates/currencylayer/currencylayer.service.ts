import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IExchangeRateAPIService } from '../interfaces/exchange-rate-api-service';
import { IExchangeRateExternalAPI } from '../interfaces/exchange-rate-api.interface';
import { AppConfig } from '../../../configs/config.type';
import { ICurrencyLayerResponse } from './interfaces/currencylayer.interface';

@Injectable()
export class CurrencyLayerService implements IExchangeRateAPIService {
  private readonly apiKey: string;
  private apiUrl: string;
  private readonly logger = new Logger(CurrencyLayerService.name);

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get('currencyLayer.apiKey', {
      infer: true,
    });
    this.apiUrl = this.configService.get('currencyLayer.baseUrl', {
      infer: true,
    });
  }

  async getLatestRates(
    baseCurrency = 'EUR',
    currencyCodes: string[] = [],
  ): Promise<IExchangeRateExternalAPI.ILatestRatesResponse> {
    const currencies = currencyCodes.join(',');
    const url = `${this.apiUrl}/live?access_key=${this.apiKey}&source=${baseCurrency}&currencies=${currencies}`;

    const { data } =
      await this.httpService.axiosRef.get<ICurrencyLayerResponse.IRealTimeRates>(
        url,
      );
    if (!data.success) {
      throw new Error(`CurrencyLayer Error: ${JSON.stringify(data)}`);
    }

    const rates = this.parseQuotes(data.source, data.quotes);

    return {
      baseCurrency: data.source,
      date: new Date(data.timestamp * 1000),
      rates,
    };
  }

  async getHistoricalRates(
    date: Date,
    baseCurrency = 'EUR',
    currencyCodes: string[] = [],
  ): Promise<IExchangeRateExternalAPI.IHistoricalResponse> {
    const currencies = currencyCodes.join(',');
    const [dateStr] = this.formatDateToString(date);
    const url = `${this.apiUrl}/historical?access_key=${this.apiKey}&date=${dateStr}&source=${baseCurrency}&currencies=${currencies}`;

    const { data } =
      await this.httpService.axiosRef.get<ICurrencyLayerResponse.IHistoricalRates>(
        url,
      );
    if (!data.success) {
      throw new Error(`CurrencyLayer Error: ${JSON.stringify(data)}`);
    }
    const rates = this.parseQuotes(data.source, data.quotes);

    return {
      baseCurrency: data.source,
      date: new Date(data.date),
      rates,
    };
  }

  async getFluctuationData(
    startDate: Date,
    endDate: Date,
    baseCurrency = 'EUR',
    currencyCodes: string[] = [],
  ): Promise<IExchangeRateExternalAPI.IFluctuationResponse> {
    const currencies = currencyCodes.join(',');
    const [startDateString, endDateString] = this.formatDateToString(
      startDate,
      endDate,
    );
    const url = `${this.apiUrl}/change?access_key=${this.apiKey}&source=${baseCurrency}&currencies=${currencies}&start_date=${startDateString}&end_date=${endDateString}`;

    const { data } = await this.httpService.axiosRef.get(url);
    if (!data.success) {
      this.logger.error('CurrencyLayer Error: ', data);
      throw new Error(`CurrencyLayer Error: ${JSON.stringify(data)}`);
    }

    const fluctuationRates: Record<
      string,
      IExchangeRateExternalAPI.TFluctuation
    > = Object.fromEntries(
      Object.entries<any>(data.quotes).map(([pair, info]) => {
        const targetCurrency = pair.replace(data.source, '');
        return [
          targetCurrency,
          {
            startRate: info.start_rate,
            endRate: info.end_rate,
            change: info.change,
            changePct: info.change_pct,
          },
        ];
      }),
    );

    return {
      baseCurrency: data.source,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      rates: fluctuationRates,
    };
  }

  async getTimeSeriesData(
    startDate: Date,
    endDate: Date,
    baseCurrency = 'EUR',
    currencyCodes: string[] = [],
  ): Promise<IExchangeRateExternalAPI.ITimeSeriesResponse> {
    const currencies = currencyCodes.join(',');
    const [convertStartDate, convertEndDate] = this.formatDateToString(
      startDate,
      endDate,
    );

    const url = `${this.apiUrl}/timeframe?access_key=${this.apiKey}&source=${baseCurrency}&currencies=${currencies}&start_date=${convertStartDate}&end_date=${convertEndDate}`;

    const { data } =
      await this.httpService.axiosRef.get<ICurrencyLayerResponse.ITimeFrameRates>(
        url,
      );
    if (!data.success) {
      throw new Error(`CurrencyLayer Error: ${JSON.stringify(data)}`);
    }

    const timeSeriesRates: Record<
      string,
      Record<string, number>
    > = Object.fromEntries(
      Object.entries(data.quotes).map(([dateKey, quotesObj]) => [
        dateKey,
        Object.fromEntries(
          Object.entries(quotesObj).map(([pair, rate]) => [
            pair.replace(data.source, ''),
            rate,
          ]),
        ),
      ]),
    );

    return {
      baseCurrency: data.source,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      rates: timeSeriesRates,
    };
  }

  /**
   * Parses a simple quotes object.
   *
   * Example:
   * Input: { "USDKRW": 1304.55, "USDEUR": 0.9234 }
   * Output: { "KRW": 1304.55, "EUR": 0.9234 }
   *
   * @param source - Base currency code (e.g., "USD").
   * @param quotes - Quotes object from CurrencyLayer.
   * @returns Parsed rates.
   */
  private parseQuotes(
    source: string,
    quotes: Record<string, number>,
  ): Record<string, number> {
    return Object.fromEntries(
      Object.entries(quotes).map(([pair, rate]) => {
        const targetCurrency = pair.replace(source, '');
        return [targetCurrency, rate];
      }),
    );
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
