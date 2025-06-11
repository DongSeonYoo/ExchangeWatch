import { IsNotEmpty } from 'class-validator';
import { IsValidCurrencyCode } from '../../../common/decorators/validations/is-valid-currency.validator';

export class LatestRateSSERequestDto {
  /**
   * 기준 통화
   */
  @IsNotEmpty()
  @IsValidCurrencyCode()
  baseCurrency: string;
}
