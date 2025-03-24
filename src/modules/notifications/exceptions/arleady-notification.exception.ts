import { ConflictException } from '@nestjs/common';

export class AlreadyRegisterNotificationException extends ConflictException {
  constructor(message = 'already registred notification') {
    super(message);
  }
}
