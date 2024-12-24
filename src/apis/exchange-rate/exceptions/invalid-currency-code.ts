import { BadRequestException } from '@nestjs/common';

export class InvalidCurrencyCodeException extends BadRequestException {
  constructor(message: string = '올바르지 않은 통화 코드입니다') {
    super(message);
  }
}
