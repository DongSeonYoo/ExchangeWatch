import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {
    super(
      configService.get<string>('NODE_ENV') === 'development'
        ? {}
        : {
            log: ['query'],
          },
    );
  }
  async onModuleInit() {
    await this.$connect();
  }
}
