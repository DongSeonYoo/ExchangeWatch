import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';
import { ILogger } from './interfaces/logger.interface';

@Injectable()
export class LoggerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveLog(input: ILogger.ICreateLog) {
    await this.prisma.systemLogs.create({
      data: {
        level: input.level,
        message: input.message,
        context: input.context,
        trace: input.trace?.toString(),
      },
    });

    return;
  }
}
