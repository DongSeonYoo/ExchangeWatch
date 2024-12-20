import { NotFoundException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(message: string = '사용자를 찾을 수 없습니다.') {
    super(message);
  }
}
