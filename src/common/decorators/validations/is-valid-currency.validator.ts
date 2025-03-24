import { BadRequestException } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import * as currency from 'currency-codes';

/**
 * Validate currency-code based on ISO-4217
 */
export function IsValidCurrencyCode(validationOptions?: ValidationOptions) {
  return function (obj: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidCurrency',
      target: obj.constructor,
      propertyName: propertyName,
      validator: {
        validate(value: string | string[]) {
          if (propertyName === 'baseCurrency') {
            if (!value) return false;
            return currency.codes().includes(String(value).toUpperCase());
          }

          // propertyName === 'currenyCodes'
          if (!value) return true;
          const codes = Array.isArray(value) ? value : value.split(',');

          // remove whitespace from array emelemets && validate each code is a valid currency
          const res = codes
            .map((code) => code.replace(/(\s*)/g, ''))
            .every(
              (code) =>
                code.length === 3 &&
                currency.codes().includes(code.toUpperCase()),
            );

          return res;
        },
        defaultMessage(args: ValidationArguments) {
          throw new InvalidCurrencyCodeException();
        },
      },
    });
  };
}

/**
 * Check currency code from request
 *
 * { @throws } BadRequestException
 */
export class InvalidCurrencyCodeException extends BadRequestException {
  constructor(message: string = 'Invalid currency code') {
    super(message);
  }
}
