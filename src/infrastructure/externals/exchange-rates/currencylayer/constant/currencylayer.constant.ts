import { supportCurrencyList } from '../../../../../modules/exchange-rate/constants/support-currency.constant';
import { ICurrencyLayerResponse } from '../interfaces/currencylayer.interface';

/**
 * 0. 임의 난수 생성 함수: min ~ max 사이의 값을 소수점 6자리까지 반환
 */
function getRandomRate(min = 0.5, max = 2.0): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(6));
}

/**
 * 최신 환율 데이터 목 함수
 * baseCurrency와 대상 통화(currencyCodes)를 받아, 해당 목 데이터를 생성하여 반환.
 *
 * IRealTimeRates 구조:
 * {
 *   success: boolean,
 *   terms: string,
 *   privacy: string,
 *   timestamp: number,
 *   source: string,
 *   quotes: Record<string, number>
 * }
 */
export const mockLatestRateFn = (
  baseCurrency: string,
  currencyCodes: string[] = [],
): Promise<ICurrencyLayerResponse.IRealTimeRates> => {
  const upperSymbols =
    currencyCodes.length > 0
      ? currencyCodes.map((s) => s.toUpperCase())
      : supportCurrencyList.filter((c) => c !== baseCurrency);
  const quotes: Record<string, number> = {};
  upperSymbols.forEach((target) => {
    // key: "BASETARGET", value: 임의의 환율 값
    quotes[`${baseCurrency}${target}`] = getRandomRate();
  });
  return Promise.resolve({
    success: true,
    terms: 'https://currencylayer.com/terms',
    privacy: 'https://currencylayer.com/privacy',
    timestamp: Math.floor(Date.now() / 1000),
    source: baseCurrency,
    quotes,
  });
};

/**
 * 역사적 환율 데이터 목 함수
 * 주어진 date(조회할 날짜), baseCurrency, 대상 통화(currencyCodes)에 대해 목 데이터를 생성.
 *
 * IHistoricalRates 구조:
 * {
 *   success: boolean,
 *   terms: string,
 *   privacy: string,
 *   historical: boolean,
 *   date: Date,
 *   timestamp: number,
 *   source: string,
 *   quotes: Record<string, number>
 * }
 */
export const mockHistoricalRateFn = (
  date: Date,
  baseCurrency: string,
  currencyCodes: string[] = [],
): Promise<ICurrencyLayerResponse.IHistoricalRates> => {
  const upperSymbols =
    currencyCodes.length > 0
      ? currencyCodes.map((s) => s.toUpperCase())
      : supportCurrencyList.filter((c) => c !== baseCurrency);
  const quotes: Record<string, number> = {};
  upperSymbols.forEach((target) => {
    quotes[`${baseCurrency}${target}`] = getRandomRate();
  });
  return Promise.resolve({
    success: true,
    terms: 'https://currencylayer.com/terms',
    privacy: 'https://currencylayer.com/privacy',
    historical: true,
    date,
    timestamp: Math.floor(date.getTime() / 1000),
    source: baseCurrency,
    quotes,
  });
};

/**
 * 변동(Fluctuation) 데이터 목 함수
 * 주어진 startDate와 endDate, baseCurrency, 대상 통화(currencyCodes)에 대해 목 데이터를 생성.
 * IFluctuationResponse 구조:
 * {
 *   success: boolean,
 *   terms: string,
 *   privacy: string,
 *   timeframe: boolean,
 *   start_date: Date,
 *   end_date: Date,
 *   source: string,
 *   quotes: Record<string, { start_rate: number; end_rate: number; change: number; change_pct: number }>
 * }
 */
export const mockFluctuationRatesFn = (
  startDate: Date,
  endDate: Date,
  baseCurrency: string,
  currencyCodes: string[] = [],
): Promise<ICurrencyLayerResponse.IFluctuationResponse> => {
  const upperSymbols =
    currencyCodes.length > 0
      ? currencyCodes.map((s) => s.toUpperCase())
      : supportCurrencyList.filter((c) => c !== baseCurrency);
  const quotes: ICurrencyLayerResponse.IFluctuationResponse['quotes'] = {};
  // 각 대상 통화에 대해 하나의 fluctuation 데이터를 생성 (단일 값, 실제는 기간 데이터에서 계산)
  upperSymbols.forEach((target) => {
    const key = `${baseCurrency}${target}`;
    const start_rate = getRandomRate();
    const pctChange = parseFloat((Math.random() * 0.4 - 0.2).toFixed(6)); // -0.2 ~ +0.2
    const end_rate = parseFloat((start_rate * (1 + pctChange)).toFixed(6));
    const change = parseFloat((end_rate - start_rate).toFixed(6));
    const change_pct = parseFloat(((change / start_rate) * 100).toFixed(4));
    quotes[key] = { start_rate, end_rate, change, change_pct };
  });
  return Promise.resolve({
    success: true,
    terms: 'https://currencylayer.com/terms',
    privacy: 'https://currencylayer.com/privacy',
    change: true,
    start_date: startDate,
    end_date: endDate,
    source: baseCurrency,
    quotes,
  });
};

/**
 * 타임시리즈(TimeFrame) 데이터 목 함수
 * 주어진 startDate, endDate, baseCurrency, 대상 통화(currencyCodes)에 대해 목 데이터를 생성.
 * ITimeFrameRates 구조:
 * {
 *   success: boolean,
 *   terms: string,
 *   privacy: string,
 *   timeframe: boolean,
 *   start_date: Date,
 *   end_date: Date,
 *   source: string,
 *   quotes: Record<string, Record<string, number>>
 * }
 *
 * 여기서는 기간 내에 각 날짜별로, 대상 통화의 임의 환율 값을 생성.
 */
export const mockTimeSeriesRateFn = (
  startDate: Date,
  endDate: Date,
  baseCurrency: string,
  currencyCodes: string[] = [],
): Promise<ICurrencyLayerResponse.ITimeFrameRates> => {
  // 날짜 차이를 계산해서 일수(count) 결정 (간단히 1일 = 86400000ms)
  const dayCount =
    Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  const quotes: Record<string, Record<string, number>> = {};

  // 대상 통화: symbols가 제공되면 대문자로, 아니면 기본 support 목록에서 base 제외
  const upperSymbols =
    currencyCodes.length > 0
      ? currencyCodes.map((s) => s.toUpperCase())
      : supportCurrencyList.filter((c) => c !== baseCurrency);

  // 각 날짜에 대해 환율 데이터 생성
  for (let i = 0; i < dayCount; i++) {
    const currentDate = new Date(startDate.getTime() + i * 86400000);
    const dateKey = currentDate.toISOString().split('T')[0];
    const dayQuotes: Record<string, number> = {};
    upperSymbols.forEach((target) => {
      dayQuotes[`${baseCurrency}${target}`] = getRandomRate();
    });
    quotes[dateKey] = dayQuotes;
  }

  return Promise.resolve({
    success: true,
    terms: 'https://currencylayer.com/terms',
    privacy: 'https://currencylayer.com/privacy',
    timeframe: true,
    start_date: startDate,
    end_date: endDate,
    source: baseCurrency,
    quotes,
  });
};
