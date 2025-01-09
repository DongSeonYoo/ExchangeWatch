import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { InvalidPropertyException } from '../../apis/exchange-rate/exceptions/invalid-property.exception';

/**
 * @param targetPropertyName target property name in same context
 * @param [validationOptions]
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
            return false;
          }
          return true;
        },
        defaultMessage(validationArguments: ValidationArguments) {
          throw new InvalidPropertyException(validationArguments.value);
        },
      },
    });
  };
}
