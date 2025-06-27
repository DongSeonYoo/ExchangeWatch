import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { IExceptionResponse } from 'src/common/dto/interfaces/response.interface';
import { CustomLoggerService } from '../logger/custom-logger.service';

@Catch(Error)
export class UnhandledExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLoggerService) {
    this.logger.context = UnhandledExceptionFilter.name;
  }

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

    this.logger.error(exception.message, exception.stack);

    return res.status(statusCode).send(response);
  }
}
