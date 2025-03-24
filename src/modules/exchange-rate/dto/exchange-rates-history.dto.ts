import { IsDate, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ExchangeRatesDailyEntity } from '../entities/exchange-rate-daily.entity';
import { IsValidCurrencyCode } from '../../../common/decorators/validations/is-valid-currency.validator';
import { IsBeforeThan } from '../../../common/decorators/validations/is-before-than.validator';
import { IsAfter } from '../../../common/decorators/validations/is-after.validator';

export class CurrentExchangeHistoryReqDto {
  /**
   * 기준 통화
   *
   * @example EUR
   */
  @IsNotEmpty()
  @IsValidCurrencyCode()
  baseCurrency: string;

  /**
   * 비교할 대상 통화
   *
   * @example KRW
   */
  @IsNotEmpty()
  @IsValidCurrencyCode()
  currencyCode: string;

  /**
   * 시작 시간
   *
   * @example 2025-01-13
   */
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsBeforeThan('endedAt', 1, 'years')
  startedAt: Date;

  /**
   * 종료 시간
   *
   * @example 2025-01-14
   */
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsAfter()
  endedAt: Date;
}

export class RateHistory {
  /**
   * 날짜
   *
   * @example 2024-01-01
   */
  date: Date;

  /**
   * 시가
   *
   * @example 1304.50
   */
  open: number;

  /**
   * 고가
   *
   * @example 1304.50
   */
  high: number;

  /**
   * 저가
   *
   * @example 1304.50
   */
  low: number;

  /**
   * 종가
   *
   * @example 1304.50
   */
  close: number;

  /**
   * 평균가
   *
   * @example 1304.50
   */
  average: number;

  /**
   * 수집된 데이터 수 (1일 144개 정상)
   *
   * @example 144
   */
  rateCount: number;
}

export class CurrentExchangeHistoryResDto {
  /**
   * 기준 통화
   *
   * @example EUR
   */
  baseCurrency: string;

  /**
   * 비교할 대상 통화
   *
   * @example KRW
   */
  currencyCode: string;

  /**
   * 일별 OHLC 데이터
   */
  rates: RateHistory[];

  constructor(args: CurrentExchangeHistoryResDto) {
    Object.assign(this, args);
  }

  static of(
    baseCurrency: string,
    currencyCode: string,
    entities: ExchangeRatesDailyEntity[],
  ) {
    return new CurrentExchangeHistoryResDto({
      baseCurrency,
      currencyCode,
      rates: entities.map((entity) => ({
        date: entity.ohlcDate,
        open: entity.openRate,
        high: entity.highRate,
        low: entity.lowRate,
        close: entity.closeRate,
        average: entity.avgRate,
        rateCount: entity.rateCount,
      })),
    });
  }
}
