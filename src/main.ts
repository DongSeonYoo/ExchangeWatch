import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { setSwagger } from './configs/swagger.config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = app.get(ConfigService).get('PORT');

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  setSwagger(app);

  await app.listen(PORT);
}

bootstrap();
