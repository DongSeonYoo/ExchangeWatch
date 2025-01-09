import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsValidCurrencyCode } from '../../../decorators/validations/is-valid-currency.validator';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { IFixerAPIResponse } from '../interface/fixer-api.response';

export class CurrentExchangeRateReqDto {
  /**
   * 기준 통화
   *
   * @example EUR
   */
  @IsNotEmpty()
  @IsValidCurrencyCode()
  baseCurrency: string;

  /**
   * 조회 할 통화
   *
   * @example USD, JPY
   */
  @ApiProperty({ type: String })
  @Transform(
    ({ value }) =>
      value
        ?.split(',')
        .map((e: string) => e.replace(/(\s*)/g, '').toUpperCase()) ?? [],
  )
  @IsValidCurrencyCode()
  currencyCodes?: string[] = [];
}

class RateDetail {
  /**
   * 환율
   */
  rate: number;

  /**
   * 전일대비 등락
   */
  dayChange: number;

  /**
   * 전일대비 등락율
   */
  dayChangePercent: number;

  /**
   * 24시 전고가
   */
  high24h: number;

  /**
   * 24시 전저가
   */
  low24h: number;
}

@ApiExtraModels(RateDetail)
export class CurrentExchangeRateResDto {
  /**
   * 기준 통화
   *
   * @example EUR
   */
  baseCurrency: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(RateDetail) },
    example: {
      KRW: {
        rate: 1529.4,
        dayChange: 15.3,
        dayChangePercent: 1.2,
        high24h: 1529.4,
        low24h: 1529.4,
      },
      JPY: {
        rate: 163.07,
        dayChange: 15.3,
        dayChangePercent: 1.2,
        high24h: 163.07,
        low24h: 163.07,
      },
      USD: {
        rate: 1.04,
        dayChange: 15.3,
        dayChangePercent: 1.2,
        high24h: 1.04,
        low24h: 1.04,
      },
    },
  })
  rates: Record<string, RateDetail>;

  constructor(baseCurrency: string, rates: Record<string, RateDetail>) {
    this.baseCurrency = baseCurrency;
    this.rates = rates;
  }

  /**
   * @param currentRates currentRates api result
   * @param fluctuationRates fluctuationRates api result
   * @param [currencyCodes] required currencyCodes
   * @returns
   */
  static of(
    currentRates: IFixerAPIResponse.IRateResponse,
    fluctuationRates: IFixerAPIResponse.IFluctuationResponse,
    currencyCodes?: string[],
  ): CurrentExchangeRateResDto {
    const targetCodes = currencyCodes?.length
      ? currencyCodes
      : Object.keys(currentRates.rates);

    const ratesResult = targetCodes.reduce<Record<string, RateDetail>>(
      (acc, code) => {
        const rate = currentRates.rates[code];
        const fluctuation = fluctuationRates.rates[code];
        acc[code] = {
          rate: rate,
          dayChange: fluctuation.change,
          dayChangePercent: fluctuation.change_pct,
          high24h: Math.max(fluctuation.start_rate, fluctuation.end_rate),
          low24h: Math.min(fluctuation.start_rate, fluctuation.end_rate),
        };

        return acc;
      },
      {},
    );

    return new CurrentExchangeRateResDto(currentRates.base, ratesResult);
  }
}
