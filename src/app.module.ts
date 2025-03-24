import {
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { DateUtilModule } from './common/utils/date-util/date-util.module';
import { ExchangeRateModule } from './modules/exchange-rate/exchange-rate.module';
import { NewsModule } from './modules/news/news.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { appConfig } from './infrastructure/config/env/env.config';
import { envValidationSchema } from './infrastructure/config/env/env.validation';
import { ExternalAPIModule } from './infrastructure/externals/external.module';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { NotificationModule } from './modules/notifications/notification.module';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { PrismaService } from './infrastructure/database/prisma/prisma.service';
import { TokenModule } from './modules/token/token.module';
import { SseModule } from './modules/sse/sse.module';
import { UnhandledExceptionFilter } from './common/filter/unhandled-exception.filter';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { SuccessResponseInterceptor } from './common/interceptor/response.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [appConfig],
      validationOptions: {
        abortEarly: false,
      },
      cache: true,
      expandVariables: true,
    }),
    ClsModule.forRoot({
      plugins: [
        new ClsPluginTransactional({
          imports: [PrismaModule],
          adapter: new TransactionalAdapterPrisma({
            prismaInjectionToken: PrismaService,
          }),
        }),
      ],
    }),
    UsersModule,
    AuthModule,
    PrismaModule,
    TokenModule,
    DateUtilModule,
    ExchangeRateModule,
    NotificationModule,
    NewsModule,
    WatchlistModule,
    ExternalAPIModule,
    NotificationModule,
    SseModule,
  ],
  providers: [
    LoggerMiddleware,
    Logger,
    {
      provide: APP_FILTER,
      useClass: UnhandledExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SuccessResponseInterceptor,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
        }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('');
  }
}
