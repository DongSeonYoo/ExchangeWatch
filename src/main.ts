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
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://localhost:4000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  setSwagger(app);

  await app.listen(PORT);
}

bootstrap();
