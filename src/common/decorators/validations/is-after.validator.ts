import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DateUtilService } from '../../utils/date-util/date-util.service';
import { BadRequestException } from '@nestjs/common';

type ValidateDateType = 'years' | 'month' | 'day';

@ValidatorConstraint({ name: 'isAfter', async: true })
export class IsAfterConstraint implements ValidatorConstraintInterface {
  constructor(private readonly dateUtilService: DateUtilService) {}
  validate(value: Date, args: ValidationArguments) {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return false;
    }

    const [amount, dateFormat] = args.constraints as [
      number?,
      ValidateDateType?,
    ];
    const paramState = amount && dateFormat;
    const dateLimit = paramState
      ? this.dateUtilService.subDate(amount, dateFormat)
      : new Date();

    return value < dateLimit;
  }

  defaultMessage(args: ValidationArguments) {
    const [amount, dateFormat] = args.constraints;
    const paramState: boolean = amount && dateFormat;
    const errorMessage = paramState
      ? `${args.property} cannot be later than ${amount} ${dateFormat} ago`
      : `${args.property} cannot be in the future`;

    throw new IsAfterException(errorMessage);
    return '';
  }
}

export function IsAfter(
  value?: number,
  dateFormat?: ValidateDateType,
  validationOptions?: ValidationOptions,
) {
  return function (obj: Object, propertyName: string) {
    registerDecorator({
      name: 'isAfter',
      target: obj.constructor,
      options: validationOptions,
      propertyName: propertyName,
      validator: IsAfterConstraint,
      constraints: [value, dateFormat],
    });
  };
}

export class IsAfterException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}
