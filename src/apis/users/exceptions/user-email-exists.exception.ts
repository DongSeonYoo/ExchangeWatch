import { ConflictException } from '@nestjs/common';

export class UserEmailExistsException extends ConflictException {
  constructor(message: string = '이미 존재하는 이메일입니다.') {
    super(message);
  }
}
