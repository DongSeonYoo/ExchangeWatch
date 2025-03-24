import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { AppConfig } from '../../config/config.type';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    super();
    configService.get('nodeEnv') === 'development'
      ? {
          log: ['query'],
        }
      : {};
  }
  async onModuleInit() {
    await this.$connect();
  }
}
