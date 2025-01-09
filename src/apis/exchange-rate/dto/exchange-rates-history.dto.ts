import { IsNotEmpty } from 'class-validator';
import { IsValidCurrencyCode } from '../../../decorators/validations/is-valid-currency';

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
  currencyCode: string;

  /**
   * 시작 시간 (ISO 8601)
   *
   * @todo validtor 추가
   */

  /**
   * 종료 시간 (ISO 8601)
   *
   * @todo validtor 추가
   */
}

// 저번프로젝트 뒤져서 from보다 이후시점 검증하는 커스텀 벨리데이터 만들어야댐
// 현재 시간으로부터 몇일 전까지만 조회 가능 밸리데이터도.
// 통화 코드 커스텀 밸리데이터
