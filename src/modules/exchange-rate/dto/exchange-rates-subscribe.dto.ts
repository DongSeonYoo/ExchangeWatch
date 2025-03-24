import { IsNotEmpty } from 'class-validator';
import { IsValidCurrencyCode } from '../../../common/decorators/validations/is-valid-currency.validator';

export class ExchangeRateSubscribeDto {
  @IsNotEmpty()
  @IsValidCurrencyCode()
  baseCurrency: string;

  @IsNotEmpty()
  @IsValidCurrencyCode()
  currencyCode: string;
}
