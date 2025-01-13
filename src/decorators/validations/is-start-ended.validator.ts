import { BadRequestException, Logger } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Check if the date properties have valid range
 *
 * @param targetPropertyName target property name in same context or class
 * @param [validationOptions]
 *
 * @throws IsStartedAtEndedAtException
 * @throws InvalidPropertyException
 */
export function IsStartedAtEndedAt(
  targetPropertyName: string,
  validationOptions?: ValidationOptions,
) {
  return function (obj: Object, propertyName: string) {
    registerDecorator({
      name: 'isStartedAtEndedAt',
      target: obj.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [targetPropertyName],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedProperty] = args.constraints;
          const targetValue: string | undefined = args.object[relatedProperty];
          if (!targetValue) {
            throw new InvalidPropertyException(relatedProperty);
          }

          return value < targetValue;
        },

        defaultMessage(args: ValidationArguments) {
          throw new IsStartedAtEndedAtException(
            `${args.property} is cannot be earlier then ${args.constraints}`,
          );
        },
      },
    });
  };
}

export class IsStartedAtEndedAtException extends BadRequestException {
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
    this.logger.error(`check out the arguments of IsStartedEndedAt decorators`);
  }
}
