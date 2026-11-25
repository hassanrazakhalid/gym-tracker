/**
 * Cloud Functions entry: the same Nest app as `main.ts`, served by Firebase.
 * Hosting sends /api/** here (see firebase.json), so the app and API share one
 * origin and need no CORS. The Nest app is created on the first request and reused.
 */
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, type NestExpressApplication } from '@nestjs/platform-express';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';
import { AppModule, ObserveInstrument } from './app.module.js';
import { configureApp } from './setup.js';

// Same region as Firestore (nam5) and Hosting's default for rewrites.
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });

let server: Promise<express.Express> | null = null;

async function createServer(): Promise<express.Express> {
  const instance = express();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(instance), {
    instrument: ObserveInstrument,
  });
  configureApp(app);
  await app.init();
  return instance;
}

export const api = onRequest(
  { memory: '512MiB', timeoutSeconds: 60, concurrency: 40, invoker: 'public' },
  async (req, res) => {
    server ??= createServer().catch((err: unknown) => {
      server = null; // try again on the next request
      throw err;
    });
    const handle = await server;
    handle(req, res);
  },
);
