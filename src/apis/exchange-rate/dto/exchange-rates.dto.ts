import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsValidCurrencyCode } from '../../../decorators/validations/is-valid-currency.validator';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

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

export class RateDetail {
  /**
   * 통화명 이름
   */
  name: string;

  /**
   * 현재 환율
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
        name: '대한민국 원',
        rate: 1529.4,
        dayChange: 15.3,
        dayChangePercent: 1.2,
        high24h: 1529.4,
        low24h: 1529.4,
      },
      JPY: {
        name: '일본 엔',
        rate: 163.07,
        dayChange: 15.3,
        dayChangePercent: 1.2,
        high24h: 163.07,
        low24h: 163.07,
      },
      USD: {
        name: '미국 달러',
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
