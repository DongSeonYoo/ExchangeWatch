import { BadRequestException } from '@nestjs/common';

export class AlreadyRegisterPairException extends BadRequestException {
  constructor(message: string = 'Already registered pair') {
    super(message);
  }
}
