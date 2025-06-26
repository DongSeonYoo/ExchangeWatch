import { IsDate, IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ExchangeRatesDailyEntity } from '../entities/exchange-rate-daily.entity';
import { IsValidCurrencyCode } from '../../../common/decorators/validations/is-valid-currency.validator';
import { IsBeforeThan } from '../../../common/decorators/validations/is-before-than.validator';
import { IsAfter } from '../../../common/decorators/validations/is-after.validator';

export class CurrentExchangeHistoryReqDto {
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
   * @example 2025-01-13
   */
  date: Date;

  /**
   * 환율
   *
   * @example 1304.50
   */
  rate: number;
}

export class CurrentExchangeHistoryResDto {
  /**
   * 기준 통화
   *
   * @example KRW
   */
  baseCurrency: string;

  /**
   * 비교할 대상 통화
   *
   * @example EUR
   */
  currencyCode: string;

  /**
   * 일별 환율 데이터
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
        date: entity.rateDate,
        rate: Number(entity.rate),
      })),
    });
  }
}
