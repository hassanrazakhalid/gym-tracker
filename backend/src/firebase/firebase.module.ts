import { existsSync, readFileSync } from 'node:fs';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

export const FIREBASE_APP = Symbol('FIREBASE_APP');
export const FIRESTORE = Symbol('FIRESTORE');
export const FIREBASE_AUTH = Symbol('FIREBASE_AUTH');

/**
 * Connects the Admin SDK. With FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST
 * set (see .env), everything talks to the local emulators and no credentials are
 * needed. For a real project, set FIREBASE_KEY_FILE to its service-account key.
 */
/**
 * Reads this app's own service-account key (FIREBASE_KEY_FILE), never the machine-wide
 * GOOGLE_APPLICATION_CREDENTIALS, and refuses a key that belongs to another project.
 */
function loadKey(keyFile: string | undefined, projectId: string): ServiceAccount {
  if (!keyFile || !existsSync(keyFile)) {
    throw new Error(
      `Firebase key file not found${keyFile ? ` at ${keyFile}` : ' (set FIREBASE_KEY_FILE in .env)'}. ` +
        'Download it from Firebase console → Project settings → Service accounts → Generate new private key. ' +
        'Or run against the local emulators with `npm run start:emu`.',
    );
  }
  const key = JSON.parse(readFileSync(keyFile, 'utf8')) as { project_id?: string; client_email?: string; private_key?: string };
  if (key.project_id !== projectId) {
    throw new Error(`The key in ${keyFile} is for project "${key.project_id}", but FIREBASE_PROJECT_ID is "${projectId}".`);
  }
  return { projectId: key.project_id, clientEmail: key.client_email, privateKey: key.private_key };
}

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_APP,
      inject: [ConfigService],
      useFactory: (config: ConfigService): App => {
        const projectId = config.getOrThrow<string>('FIREBASE_PROJECT_ID');
        // The Admin SDK reads emulator hosts from process.env.
        for (const key of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
          const value = config.get<string>(key);
          if (value) process.env[key] = value;
        }
        const usingEmulator = !!process.env['FIRESTORE_EMULATOR_HOST'];
        if (getApps()[0]) return getApps()[0];
        if (usingEmulator) return initializeApp({ projectId });
        return initializeApp({ projectId, credential: cert(loadKey(config.get<string>('FIREBASE_KEY_FILE'), projectId)) });
      },
    },
    {
      provide: FIRESTORE,
      inject: [FIREBASE_APP],
      useFactory: (app: App): Firestore => {
        const db = getFirestore(app);
        try {
          // Optional fields are left out rather than rejected.
          db.settings({ ignoreUndefinedProperties: true });
        } catch {
          // settings() can only be called once per instance (e.g. across test apps).
        }
        return db;
      },
    },
    {
      provide: FIREBASE_AUTH,
      inject: [FIREBASE_APP],
      useFactory: (app: App): Auth => getAuth(app),
    },
  ],
  exports: [FIRESTORE, FIREBASE_AUTH],
})
export class FirebaseModule {}
