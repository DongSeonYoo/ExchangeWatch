import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import {
  WsBadRequestException,
  WsUnauthorizedException,
  WsUnknownException,
} from '../../modules/exchange-rate/exceptions/ws.exception';

@Catch(HttpException)
export class WsExceptionFilter extends BaseWsExceptionFilter<HttpException> {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const socket = host.switchToWs().getClient();
    if (exception instanceof BadRequestException) {
      const wsException = new WsBadRequestException(exception.message);
      socket.emit('exception', wsException.getError());
      return;
    }
    if (exception instanceof UnauthorizedException) {
      const wsException = new WsUnauthorizedException(exception.message);
      socket.emit('exception', wsException.getError());
      return;
    }

    const wsException = new WsUnknownException(exception.message);
    socket.emit('exception', wsException.getError());
  }
}
