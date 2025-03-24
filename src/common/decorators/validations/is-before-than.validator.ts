import { BadRequestException, Logger } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ValidateDateType } from './is-before.validator';
import { DateUtilService } from '../../utils/date-util/date-util.service';

@ValidatorConstraint({ name: 'isBeforeThan', async: true })
export class IsBeforeThanConstraint implements ValidatorConstraintInterface {
  constructor(private readonly dateUtilServie: DateUtilService) {}

  validate(value: Date, args: ValidationArguments) {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return false;
    }
    const [targetPropertyName, amount, dateFormat] = args.constraints as [
      string,
      number,
      ValidateDateType,
    ];

    const targetProperty = args.object[targetPropertyName];
    const dateLimit = this.dateUtilServie.subDate(
      amount,
      dateFormat,
      targetProperty,
    );

    return value > dateLimit && value < targetProperty;
  }

  defaultMessage(args: ValidationArguments): string {
    const [targetProperty, amount, dateFormat] = args.constraints as [
      string,
      number,
      ValidateDateType,
    ];
    throw new IsBeforeThanException(
      `${args.property} must be more whitin ${amount} ${dateFormat} before before ${targetProperty}`,
    );
  }
}

/**
 * Check if the date properties have valid range
 *
 * @param targetPropertyName target property name in same context or class (dto)
 * @param amount
 * @param dateFormat years | month | day
 * @param [validationOptions]
 *
 * @throws IsBeforeThanException
 * @throws InvalidPropertyException
 */
export function IsBeforeThan(
  targetPropertyName: string,
  amount: number,
  dateFormat: ValidateDateType,
  validationOptions?: ValidationOptions,
) {
  return function (obj: Object, propertyName: string) {
    registerDecorator({
      name: 'isBeforeThan',
      target: obj.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [targetPropertyName, amount, dateFormat],
      validator: IsBeforeThanConstraint,
    });
  };
}

export class IsBeforeThanException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Check for developler mistakes when using decorator arguments
 *
 * @throws Error
 */
class InvalidPropertyException extends Error {
  private readonly logger = new Logger(InvalidPropertyException.name);
  constructor(propertyName: string) {
    super();
    this.logger.error(
      `check out the arguments of IsBeforeThanException decorators`,
    );
  }
}
