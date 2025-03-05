import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IExchangeRateRestAPIService } from '../interfaces/exchange-rate-rest-api.interface';
import { IExchangeRateExternalAPI } from '../interfaces/exchange-rate-api.interface';
import { AppConfig } from '../../../configs/config.type';
import { ICurrencyLayerResponse } from './interfaces/currencylayer.interface';

@Injectable()
export class CurrencyLayerService implements IExchangeRateRestAPIService {
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

    const rates = this.parseRealTimeQuotes(data.source, data.quotes);

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
    const rates = this.parseRealTimeQuotes(data.source, data.quotes);

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

    const { data } =
      await this.httpService.axiosRef.get<ICurrencyLayerResponse.IFluctuationResponse>(
        url,
      );
    if (!data.success) {
      this.logger.error('CurrencyLayer Error: ', data);
      throw new Error(`CurrencyLayer Error: ${JSON.stringify(data)}`);
    }
    const fluctuationRates = this.parseFluctuationQuotes(
      data.source,
      data.quotes,
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
    data;

    const timeSeriesRates = this.parseTimeSeriesQuotes(
      data.source,
      data.quotes,
    );

    return {
      baseCurrency: data.source,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      rates: timeSeriesRates,
    };
  }

  /**
   * Parses a quotes object from RealTimeData of CurrencyLayer
   * Use for: RealTimeRate OR HistoricalRate
   *
   * Input: { "USDKRW": 1304.55, "USDEUR": 0.9234 }
   * Output: { "KRW": 1304.55, "EUR": 0.9234 }
   *
   * @param source - Base currency code (e.g., "USD").
   * @param quotes - Quotes object from RealTimeData of CurrencyLayer.
   * @returns Parsed rates.
   */
  protected parseRealTimeQuotes(
    source: string,
    quotes: ICurrencyLayerResponse.IRealTimeRates['quotes'],
  ): IExchangeRateExternalAPI.ILatestRatesResponse['rates'] {
    return Object.fromEntries(
      Object.entries(quotes).map(([pair, rate]) => {
        const targetCurrency = pair.replace(source, '');
        return [targetCurrency, rate];
      }),
    );
  }

  /**
   * Parses quotes object from ChangeData of CurrencyLayer
   *
   * Input:
            "USDAUD": {
              "start_rate": 1.281236,
              "end_rate": 1.108609,
              "change": -0.1726,
              "change_pct": -13.4735
            },
   * Output:
            "AUD": {
              "startRate": 1.281236,
              "endRate": 1.108609,
              "change": -0.1726,
              "changePct": -13.4735
            },
   *
   * @param source - Base currency code (e.g., "USD").
   * @param quotes - Quotes object from ChangeData of CurrencyLayer.
   * @returns Parsed rates.
   */
  protected parseFluctuationQuotes(
    source: string,
    quotes: ICurrencyLayerResponse.IFluctuationResponse['quotes'],
  ): IExchangeRateExternalAPI.IFluctuationResponse['rates'] {
    return Object.fromEntries(
      Object.entries(quotes).map(([pair, info]) => {
        const targetCurrency = pair.replace(source, '');
        return [
          targetCurrency,
          {
            startRate: info.start_rate,
            endRate: info.end_rate,
            change: info.change,
            changePct: info.change_pct,
            highRate: info.start_rate * (1 + info.change_pct / 100),
            lowRate: info.start_rate * (1 - info.change_pct / 100),
          },
        ];
      }),
    );
  }

  /**
   * Parses quotes object from TimeSeriesData of CurrencyLayer
   *
   * Input:
        "2025-01-02": {
            "USDUSD": 1,
            "USDGBP": 0.668525,
            "USDEUR": 0.738541
        },
        "2025-01-02": {
            "USDUSD": 1,
            "USDGBP": 0.668827,
            "USDEUR": 0.736145
        },
   * Output:
        "2025-01-01": {
            "USD": 1,
            "GBP": 0.668525,
            "EUR": 0.738541
        },
        "2025-01-02": {
            "USD": 1,
            "GBP": 0.668827,
            "EUR": 0.736145
        },
   *
   * @param source - Base currency code (e.g., "USD").
   * @param quotes - Quotes object from TimeSeriesData of CurrencyLayer.
   * @returns Parsed rates.
   */
  protected parseTimeSeriesQuotes(
    source: string,
    quotes: ICurrencyLayerResponse.ITimeFrameRates['quotes'],
  ): IExchangeRateExternalAPI.ITimeSeriesResponse['rates'] {
    return Object.fromEntries(
      Object.entries(quotes).map(([dateKey, quotesObj]) => [
        dateKey,
        Object.fromEntries(
          Object.entries(quotesObj).map(([pair, rate]) => [
            pair.replace(source, ''),
            rate,
          ]),
        ),
      ]),
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
