import { Inject, Injectable, LoggerService, Scope } from '@nestjs/common';
import { Logger } from 'winston';
import { LoggerRepository } from './logger.repository';

@Injectable({
  scope: Scope.TRANSIENT,
})
export class CustomLoggerService implements LoggerService {
  context: string = 'LoggerService';

  constructor(
    @Inject('winston') private readonly logger: Logger,
    private readonly loggerRepository: LoggerRepository,
  ) {}

  async log(message: string) {
    this.logger.log(message, { context: this.context });

    await this.loggerRepository.saveLog({
      level: 'LOG',
      message: message,
      context: this.context,
    });
  }

  async info(message: string) {
    this.logger.info(message, { context: this.context });

    await this.loggerRepository.saveLog({
      level: 'INFO',
      message: message,
      context: this.context,
    });
  }

  async error(message: string, trace?: string) {
    this.logger.error(message, { trace, context: this.context });

    await this.loggerRepository.saveLog({
      level: 'ERROR',
      message: message,
      context: this.context,
      trace: trace,
    });
  }

  async warn(message: string, trace?: string) {
    this.logger.warn(message, { context: this.context });

    await this.loggerRepository.saveLog({
      level: 'WARN',
      message: message,
      context: this.context,
      trace: trace,
    });
  }

  debug(message: string) {
    this.logger.debug(message, { context: this.context });
  }

  async verbose(message: string) {
    this.logger.verbose?.(message, { context: this.context });
  }
}
