import { BadRequestException } from '@nestjs/common';

export class MaxNotificationCountException extends BadRequestException {
  constructor(message: string = 'Max notification count exceeded') {
    super(message);
  }
}
