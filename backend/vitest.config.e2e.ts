import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // The e2e suite wipes the database it runs against, so it is pinned to the
    // local emulators whatever .env says. It can never touch the real project.
    env: {
      FIREBASE_PROJECT_ID: 'demo-gym-tracker',
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
      FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
      FIREBASE_KEY_FILE: '',
    },
  },
});
