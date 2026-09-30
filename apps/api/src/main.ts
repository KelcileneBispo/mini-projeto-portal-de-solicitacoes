import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config as loadEnv } from 'dotenv';
import { AppModule } from './app.module.js';
import { readJwtConfig } from './auth/auth-config.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { validationExceptionFactory } from './common/validation-exception.factory.js';
import { readDatabaseUrl } from './prisma/database-url.js';

function readCorsOrigin(): string {
  const origin = process.env.CORS_ORIGIN?.trim();

  if (!origin) {
    throw new Error('CORS_ORIGIN é obrigatória para o navegador chamar a API.');
  }

  if (origin.includes('*')) {
    throw new Error('CORS_ORIGIN deve ser uma origem explícita.');
  }

  return origin;
}

function loadEnvironment(): void {
  let directory = dirname(fileURLToPath(import.meta.url));

  for (let depth = 0; depth < 6; depth += 1) {
    if (
      existsSync(resolve(directory, '.env')) &&
      existsSync(resolve(directory, 'pnpm-workspace.yaml'))
    ) {
      loadEnv({ path: resolve(directory, '.env') });
      return;
    }

    const parent = resolve(directory, '..');

    if (parent === directory) {
      return;
    }

    directory = parent;
  }
}

async function bootstrap(): Promise<void> {
  loadEnvironment();
  readDatabaseUrl();
  readJwtConfig();

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: readCorsOrigin(),
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const port = process.env.PORT ?? '3001';
  await app.listen(port);
}

void bootstrap();
