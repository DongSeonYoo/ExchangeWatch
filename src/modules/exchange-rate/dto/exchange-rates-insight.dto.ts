import { IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { IsValidCurrencyCode } from '../../../common/decorators/validations/is-valid-currency.validator';
import { Type } from 'class-transformer';

export class ExchangeRateInsightReqDto {
  /**
   * 기준 통화
   *
   * @example KRW
   */
  @IsNotEmpty()
  @Matches(/^KRW$/, { message: 'baseCurrency is only can be KRW.' })
  baseCurrency: string;

  /**
   * 비교할 대상 통화
   *
   * @example EUR
   */
  @IsNotEmpty()
  @IsValidCurrencyCode()
  currencyCode: string;

  /**
   * AI 분석에 사용될 과거 데이터 기간(일 단위). 기본값 7일.
   *
   * @example 7
   */
  @IsNotEmpty()
  @Type(() => Number)
  @IsOptional()
  days?: number = 7;
}

export class ExchangeRateInsightResDto {
  /**
   * AI가 생성한 환율 상황 요약 리포트
   */
  summary: string;

  static from(summary: string): ExchangeRateInsightResDto {
    const res = new ExchangeRateInsightResDto();
    res.summary = summary;

    return res;
  }
}
