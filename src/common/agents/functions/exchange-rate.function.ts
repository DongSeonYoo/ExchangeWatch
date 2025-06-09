import { ExchangeRateService } from '../../../modules/exchange-rate/services/exchange-rate.service';
import {
  RateInsightSummaryInput,
  RateInsightSummaryOutput,
} from '../interfaces/rate-insight.interface';
import { CustomLoggerService } from '../../logger/custom-logger.service';
import { DateUtilService } from '../../utils/date-util/date-util.service';

export class ExchangeRateFunction {
  constructor(
    private readonly exchangeRateService: ExchangeRateService,
    private readonly loggerService: CustomLoggerService,
    private readonly dateUtilService: DateUtilService,
  ) {
    this.loggerService.context = ExchangeRateFunction.name;
  }

  /**
   * 환율의 OHLC 히스토리 데이터를 분석하여 현재 환율 위치, 추세, 변동성 등을 종합적 데이터를 반환합니다
   *
   * @param input 환율 분석을 위한 매개변수
   * @returns 정확한 분석을 위한 해당 기간 간의 환율 데이터
   */
  async summarizePercentileInsight(
    input: RateInsightSummaryInput,
  ): Promise<RateInsightSummaryOutput> {
    const currentData = await this.exchangeRateService.getCurrencyExchangeRates(
      {
        baseCurrency: input.baseCurrency,
        currencyCodes: [input.currencyCode],
      },
    );
    const currentRate = currentData.rates[input.currencyCode].rate;
    const startDate = this.dateUtilService.subDate(input.days, 'day');
    const endDate = new Date();

    const historicalData = await this.exchangeRateService.getHistoricalRates({
      baseCurrency: input.baseCurrency,
      currencyCode: input.currencyCode,
      startedAt: startDate,
      endedAt: endDate,
    });

    return {
      baseCurrency: input.baseCurrency,
      currencyCode: input.currencyCode,
      currentRate: currentRate,
      historicalData: historicalData.map((e) => ({
        avg: e.avgRate,
        close: e.closeRate,
        high: e.highRate,
        low: e.lowRate,
        ohlcDate: e.ohlcDate,
        open: e.openRate,
      })),
    };
  }
}
