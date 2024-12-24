import { registerDecorator, ValidationOptions } from 'class-validator';
import * as currency from 'currency-codes';
import { InvalidCurrencyCodeException } from '../exceptions/invalid-currency-code';

/**
 * Validate currency-code based on ISO-4217
 */
export function IsValidCurrencyCode(validationOptions?: ValidationOptions) {
  return function (obj: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidCurrency',
      target: obj.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value || typeof value !== 'string') return false;
          if (value.length !== 3) return false;

          return currency.codes().includes(value.toUpperCase());
        },
        defaultMessage() {
          throw new InvalidCurrencyCodeException();
          return '';
        },
      },
    });
  };
}
