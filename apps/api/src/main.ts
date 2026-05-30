import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import type { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });

  const config = app.get(ConfigService<{ config: AppConfig }>);
  const appConfig = config.get('config', { infer: true }) as AppConfig;

  // Безопасность и парсинг cookie (refresh-токен).
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cookieParser());

  // CORS: разрешаем фронтенд с передачей cookie.
  app.enableCors({
    origin: [appConfig.appPublicUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Единый префикс API.
  app.setGlobalPrefix('api');

  // Глобальная валидация DTO + единый формат ошибок.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger — интерактивная документация API.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TechIntern API')
    .setDescription('API платформы поиска стажировок для IT-студентов')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(appConfig.port, '0.0.0.0');
  new Logger('Bootstrap').log(
    `TechIntern API запущен на ${appConfig.apiPublicUrl} (порт ${appConfig.port}). Документация: /docs`,
  );
}

void bootstrap();
