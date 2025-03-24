import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent');
    const datetime = new Date();
    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.log(
        `${datetime}-${method} ${originalUrl} ${statusCode} ${ip} ${userAgent}`,
      );
    });

    return next();
  }
}
