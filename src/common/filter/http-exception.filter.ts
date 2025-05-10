import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { IExceptionResponse } from 'src/common/dto/interfaces/response.interface';
import { CustomLoggerService } from '../logger/custom-logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLoggerService) {
    this.logger.context = HttpExceptionFilter.name;
  }

  private convertErrorMessage(errors: string[]): string {
    return errors.map((err) => `Validation Error: ${err}`).join(', ');
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req: Request = ctx.getRequest();
    const res: Response = ctx.getResponse();

    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionMessage = exception.getResponse()['message'] as
      | string
      | string[];
    const response: IExceptionResponse = {
      message: Array.isArray(exceptionMessage)
        ? this.convertErrorMessage(exceptionMessage)
        : exceptionMessage,
      requestURL: req.url,
      statusCode: status,
      timestamp: new Date(),
    };

    return res.status(status).json(response);
  }
}
