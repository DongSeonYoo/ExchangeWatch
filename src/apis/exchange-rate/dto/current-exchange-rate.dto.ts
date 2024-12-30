import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsValidCurrencyCode } from '../validations/is-valid-currency';
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
   * @example KRW,JPY,USD
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
  @ApiProperty({ description: '현재 환율' })
  rate: number;

  @ApiProperty({ description: '전일대비 등락률' })
  dayChange: number;

  @ApiProperty({ description: '전일대비 등락 퍼센트' })
  dayChangePercent: number;

  @ApiProperty({ description: '24시 전고가' })
  high24h: number;

  @ApiProperty({ description: '24시 전저가' })
  low24h: number;
}

@ApiExtraModels(RateDetail)
export class CurrentExchangeRateResDto {
  @ApiProperty({ example: 'EUR' })
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
}