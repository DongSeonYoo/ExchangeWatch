import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, Matches } from 'class-validator';
import { IsValidCurrencyCode } from '../../../common/decorators/validations/is-valid-currency.validator';

export class CurrentExchangeRateReqDto {
  /**
   * 기준 통화
   *
   * @example EUR
   */
  @IsNotEmpty()
  @Matches(/^KRW$/, { message: 'baseCurrency is only can be KRW.' })
  baseCurrency: string;

  /**
   * 조회 할 통화
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

export class RateDetail {
  /**
   * 통화명 이름
   *
   * @example KRW
   */
  name: string;

  /**
   * 현재 환율
   *
   * @example 1624
   */
  rate: number;

  /**
   * 전일대비 등락
   *
   * @example -12.5
   */
  dayChange: number;

  /**
   * 전일대비 등락율
   *
   * @example -1.2
   */
  dayChangePercent: number;

  /**
   * 변환 환율
   *
   * @example 0.00061
   */
  inverseRate: number;

  /**
   * 타임스탬프
   */
  timestamp: Date;
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
  })
  rates: Record<string, RateDetail>;

  constructor(baseCurrency: string, rates: Record<string, RateDetail>) {
    this.baseCurrency = baseCurrency;
    this.rates = rates;
  }

  /**
   * @param baseCurrency baseCurrency
   * @param rates latest exchange rate
   * @returns
   */
  static of(
    baseCurrency: string,
    rates: Record<string, RateDetail>,
  ): CurrentExchangeRateResDto {
    return new CurrentExchangeRateResDto(baseCurrency, rates);
  }
}
