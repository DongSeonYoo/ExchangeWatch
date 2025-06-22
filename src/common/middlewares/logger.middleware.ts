import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CustomLoggerService } from '../logger/custom-logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: CustomLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent');
    const datetime = new Date();
    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.info(
        `${datetime}-${method} ${originalUrl} ${statusCode} ${ip} ${userAgent}`,
      );
    });

    return next();
  }
}
