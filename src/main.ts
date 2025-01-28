import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { setSwagger } from './configs/swagger.config';
import { useContainer } from 'class-validator';
import { AppConfig } from './configs/config.type';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = app
    .get<ConfigService<AppConfig, true>>(ConfigService)
    .get('port', { infer: true });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  setSwagger(app);

  await app.listen(PORT);
}

bootstrap();
