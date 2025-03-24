import { BadRequestException } from '@nestjs/common';

export class MaximumPairException extends BadRequestException {
  constructor(message: string = 'Too many currency paris') {
    super(message);
  }
}
