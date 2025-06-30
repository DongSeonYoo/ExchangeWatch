import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { setSwagger } from './infrastructure/config/swagger.config';
import { useContainer } from 'class-validator';
import { AppConfig } from './infrastructure/config/config.type';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const PORT = configService.get('port', { infer: true });
  const frontendUrl =
    configService.get('nodeEnv') === 'development'
      ? 'localhost:4000'
      : configService.get('frontendURL');

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.enableCors({
    origin: [frontendUrl],
    credentials: true,
    methods: ['*'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableShutdownHooks();

  setSwagger(app);

  await app.listen(PORT);
}

bootstrap();
