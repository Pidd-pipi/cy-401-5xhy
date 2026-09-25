import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorHandlerMiddleware } from './common/middlewares/error-handler.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false
    })
  );
  app.use(new ErrorHandlerMiddleware().use);
  await app.listen(Number(process.env.BACKEND_PORT || 29068), '0.0.0.0');
}

bootstrap();
