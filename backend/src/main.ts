import { StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule, ObserveInstrument } from './app.module.js';

/** Shared setup for the server and the e2e tests. */
export function configureApp(app: NestExpressApplication): void {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  // Progress photos travel as data URLs, so allow bodies a little over Express's 100 kB default.
  app.useBodyParser('json', { limit: '1mb' });
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:4200,http://localhost:4300')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, allowedHeaders: ['Authorization', 'Content-Type'] });
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });
  configureApp(app);
  await app.listen(process.env.PORT ?? 3000);
}

if (process.env.VITEST === undefined) await bootstrap();
