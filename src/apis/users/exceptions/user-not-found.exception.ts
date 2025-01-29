import { NotFoundException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(message: string = 'User Not Found') {
    super(message);
  }
}
