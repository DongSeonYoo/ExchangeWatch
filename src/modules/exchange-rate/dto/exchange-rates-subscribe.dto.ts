import { IsNotEmpty, Matches } from 'class-validator';
import { IsValidCurrencyCode } from '../../../common/decorators/validations/is-valid-currency.validator';

export class ExchangeRateSubscribeDto {
  @IsNotEmpty()
  @Matches(/^KRW$/, { message: 'baseCurrency is only can be KRW.' })
  baseCurrency: string;

  @IsNotEmpty()
  @IsValidCurrencyCode()
  currencyCode: string;
}
