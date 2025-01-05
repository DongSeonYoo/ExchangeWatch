import { PickType } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';
import { ExchangeRatesEntity } from '../entitites/exchange-rate.entity';
import { Type } from 'class-transformer';
import { IsValidCurrencyCode } from '../../../decorators/validations/validations/is-valid-currency';

export class CurrentExchangeHistoryReqDto extends PickType(
  ExchangeRatesEntity,
  ['baseCurrency', 'currencyCode'],
) {
  @IsNotEmpty()
  @IsValidCurrencyCode()
  currencyCode: string;

  @IsNotEmpty()
  baseCurrency: string;

  /**
   * 시작 시간 (ISO 8601)
   *
   * @todo validtor 추가
   */
  @IsNotEmpty()
  @IsDateString()
  @Type(() => Date)
  from: Date;

  /**
   * 종료 시간 (ISO 8601)
   *
   * @todo validtor 추가
   */
  @IsNotEmpty()
  @IsDateString()
  @Type(() => Date)
  to: Date;
}

// 저번프로젝트 뒤져서 from보다 이후시점 검증하는 커스텀 벨리데이터 만들어야댐
// 현재 시간으로부터 몇일 전까지만 조회 가능 밸리데이터도.
// 통화 코드 커스텀 밸리데이터
