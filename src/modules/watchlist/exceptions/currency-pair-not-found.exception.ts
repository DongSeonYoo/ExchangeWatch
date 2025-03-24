import { NotFoundException } from '@nestjs/common';

export class CurrencyPairNotFoundException extends NotFoundException {
  constructor(message: string = 'CurrencyPair not found') {
    super(message);
  }
}
