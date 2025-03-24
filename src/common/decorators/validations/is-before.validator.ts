import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DateUtilService } from '../../utils/date-util/date-util.service';
import { BadRequestException } from '@nestjs/common';

export type ValidateDateType = 'years' | 'month' | 'day';

@ValidatorConstraint({ name: 'isBefore', async: true })
export class IsBeforeConstraint implements ValidatorConstraintInterface {
  constructor(private readonly dateUtilService: DateUtilService) {}
  validate(value: Date, args: ValidationArguments) {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return false;
    }

    const [amount, dateFormat] = args.constraints as [number, ValidateDateType];
    const dateLimit = this.dateUtilService.subDate(amount, dateFormat);

    return value > dateLimit;
  }

  defaultMessage(args: ValidationArguments) {
    const [amount, dateFormat] = args.constraints;

    throw new IsBeforeException(
      `${args.property} cannot be earlier than ${amount} ${dateFormat} ago`,
    );
    return '';
  }
}

export function IsBefore(
  value: number,
  dateFormat: ValidateDateType,
  validationOptions?: ValidationOptions,
) {
  return function (obj: Object, propertyName: string) {
    registerDecorator({
      name: 'isBefore',
      target: obj.constructor,
      options: validationOptions,
      propertyName: propertyName,
      validator: IsBeforeConstraint,
      constraints: [value, dateFormat],
    });
  };
}

export class IsBeforeException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}
