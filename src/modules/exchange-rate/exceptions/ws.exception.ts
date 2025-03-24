import { WsException } from '@nestjs/websockets';

type WsExceptionType =
  | 'BadRequestException'
  | 'UnauthorizedException'
  | 'UnknownException';

export class WsTypeException extends WsException {
  readonly type: WsExceptionType;

  constructor(type: WsExceptionType, message: string) {
    const error = {
      type,
      message,
    };

    super(error);
    this.type = type;
  }
}

export class WsBadRequestException extends WsTypeException {
  constructor(message: string) {
    super('BadRequestException', message);
  }
}

export class WsUnauthorizedException extends WsTypeException {
  constructor(message: string) {
    super('UnauthorizedException', message);
  }
}

export class WsUnknownException extends WsTypeException {
  constructor(message: string) {
    super('UnknownException', message);
  }
}
