import { Inject, Injectable, LoggerService, Scope } from '@nestjs/common';
import { Logger } from 'winston';

@Injectable()
export class CustomLoggerService implements LoggerService {
  context: string = 'LoggerService';

  constructor(@Inject('winston') private readonly logger: Logger) {}

  async log(message: string) {
    this.logger.info(message, { context: this.context });
  }

  async info(message: string) {
    this.logger.info(message, { context: this.context });
  }

  async error(message: string, trace?: string) {
    this.logger.error(message, { trace, context: this.context });
  }

  async warn(message: string, trace?: string) {
    this.logger.warn(message, { context: this.context });
  }

  debug(message: string) {
    this.logger.debug(message, { context: this.context });
  }

  async verbose(message: string) {
    this.logger.verbose?.(message, { context: this.context });
  }
}
