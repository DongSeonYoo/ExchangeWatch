import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { IExceptionResponse } from 'src/interfaces/response.interface';

@Catch(Error)
export class UnhandledExceptionFilter implements ExceptionFilter {

  constructor(private readonly logger: Logger) {}
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    const response: IExceptionResponse = {
      message: '서버에서 오류가 발생하였습니다',
      requestURL: req.url,
      statusCode: statusCode,
      timestamp: new Date(),
    };

    this.logger.error(exception);

    return res.status(statusCode).send(response);
  }
}
