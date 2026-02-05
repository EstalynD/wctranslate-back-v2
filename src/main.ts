import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Prefijo global para todas las rutas de la API
  app.setGlobalPrefix('api');

  // Habilitar CORS para el frontend
  app.enableCors({
    origin: [
      'http://localhost:3555',  // Frontend modelo
      'http://localhost:3556',  // Backend (para testing)
      'http://localhost:3557',  // Frontend admin
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Filtro global de excepciones
  app.useGlobalFilters(new AllExceptionsFilter());

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en DTOs
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no permitidas
      transform: true, // Transforma tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = configService.get<number>('port') || 3556;

  await app.listen(port);

  console.log(`🚀 WCTraining API corriendo en: http://localhost:${port}/api`);
  console.log(`📚 Ambiente: ${configService.get<string>('nodeEnv')}`);
}
bootstrap();
