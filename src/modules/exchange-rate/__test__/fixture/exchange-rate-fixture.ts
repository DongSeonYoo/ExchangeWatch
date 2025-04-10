import { IExchangeRateExternalAPI } from '../../../../infrastructure/externals/exchange-rates/interfaces/exchange-rate-api.interface';
import { supportCurrencyList } from '../../../../modules/exchange-rate/constants/support-currency.constant';

export class ExchangeRateFixture {
  /**
   * Creates a default latest rate response with all rates set to 1.0
   * @param baseCurrency Default is 'KRW'
   * @param date Default is 'new Date()'
   */
  static createDefaultLatestRates(
    baseCurrency = 'KRW',
    date = new Date(),
  ): IExchangeRateExternalAPI.ILatestRatesResponse {
    const rates = Object.fromEntries(
      supportCurrencyList.map((code) => [code, 1.0]),
    );

    return {
      baseCurrency,
      date,
      rates,
    };
  }

  /**
   * Creates a default fluctuation response with 0% change and flat values
   * @param baseCurrency Default is 'KRW'
   * @param startDate Default is 'new Date()'
   * @param endDate Default is '1 day before startDate'
   */
  static createDefaultFluctuationRates(
    baseCurrency = 'KRW',
    startDate = new Date(),
    endDate = new Date(startDate.getTime() - 86400000), // 하루 전
  ): IExchangeRateExternalAPI.IFluctuationResponse {
    const rates = Object.fromEntries(
      supportCurrencyList.map((code) => [
        code,
        {
          startRate: 1,
          endRate: 1,
          highRate: 1,
          lowRate: 1,
          change: 0,
          changePct: 0,
        },
      ]),
    );

    return {
      baseCurrency,
      startDate,
      endDate,
      rates,
    };
  }
}
