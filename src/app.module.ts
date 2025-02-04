import {
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './apis/users/users.module';
import { AuthModule } from './apis/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { UnhandledExceptionFilter } from './filters/unhandled-exception.filter';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { SuccessResponseInterceptor } from './interceptors/response.interceptor';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TokenModule } from './token/token.module';
import { DateUtilModule } from './utils/date-util/date-util.module';
import { ExchangeRateModule } from './apis/exchange-rate/exchange-rate.module';
import { PriceNotificationModule } from './apis/price-notification/price-notification.module';
import { AlertHistoryModule } from './apis/alert-history/alert-history.module';
import { NewsModule } from './apis/news/news.module';
import { WatchlistModule } from './apis/watchlist/watchlist.module';
import { appConfig } from './configs/env/env.config';
import { envValidationSchema } from './configs/env/env.validation';
import { ExternalAPIModule } from './externals/external.module';

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
    UsersModule,
    AuthModule,
    PrismaModule,
    TokenModule,
    DateUtilModule,
    ExchangeRateModule,
    PriceNotificationModule,
    AlertHistoryModule,
    NewsModule,
    WatchlistModule,
    ExternalAPIModule,
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
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
