import { StandardSchemaValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

/** Shared setup for the local server, the Cloud Function and the e2e tests. */
export function configureApp(app: NestExpressApplication): void {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  // Progress photos travel as data URLs, so allow bodies a little over Express's 100 kB default.
  app.useBodyParser('json', { limit: '1mb' });
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:4320')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  // The deployed app and API share one origin (Firebase Hosting), and `ng serve`
  // proxies /api, so CORS only matters for tools calling the local API directly.
  app.enableCors({ origin: origins, allowedHeaders: ['Authorization', 'Content-Type'] });
}
