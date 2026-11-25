# Workout Tracker

A mobile-first strength-training app: log workouts set by set with last session's
numbers alongside, supersets, effort ratings, rest timers, PRs, warm-ups, plus body
weight, nutrition, progress and lessons.

| Folder | What | Stack |
| --- | --- | --- |
| `front-end/` | The app | Angular 22, Firebase Auth (web SDK) |
| `backend/` | REST API | NestJS 12, Firestore + Firebase Auth via the Admin SDK |
| `firebase.json` | Emulator and Firestore config | Firebase CLI 13 (pinned in `backend/`) |

## Run it locally

Needs Node 22+. There are two ways to run it.

**Against the real Firebase project** (`gym-tracker-67e17`): the default. Real accounts and data.

```bash
# Needs backend/service-account.json (Firebase console → Project settings →
# Service accounts → Generate new private key). It is gitignored; never commit it.
cd backend && npm install && npm run start:dev    # API on http://localhost:3000/api
cd front-end && npm install && npm start          # App on http://localhost:4200
```

**Against local emulators**: no Google account needed, nothing real is touched. Also needs Java 11+.

```bash
cd backend && npm run emulators     # Auth :9099, Firestore :8080, UI http://127.0.0.1:4000
cd backend && npm run start:emu     # API, reading backend/.env.emulator
cd front-end && npm run start:emu   # App, using environment.emulator.ts
```

Create an account in the app, then choose **Load sample data** on the Dashboard to see
about nine weeks of history. Emulator data is saved to `.emulator-data/` when the
emulators stop and loaded again on the next start.

## Tests

```bash
cd front-end && npm test          # unit tests: progression arrows, PRs, warm-up builder
cd backend && npm test            # unit tests
cd backend && npm run test:e2e:emu # API tests; starts and stops its own emulators
```

`npm run test:e2e` runs the same API tests against emulators that are already running.
It **clears all emulator data first**, so don't run it while you have test accounts you want to keep.

## How it fits together

- The app signs in with Firebase Auth and sends the ID token to the API on every request.
  A global guard in the API verifies it; all data lives under `users/{uid}` in Firestore,
  so one user can never read another's.
- Browsers never talk to Firestore directly (`firestore.rules` denies everything); only the API does.
- The exercise library, routines and lessons ship with both apps (`front-end/src/app/core/content`,
  `backend/src/library/data`). The API validates every exercise, routine and lesson id against its copy.
- Weights are stored in kilograms and shown in the user's unit.

## The Firebase project

- Project `gym-tracker-67e17` (alias `prod` in `.firebaserc`), Spark plan.
- The API loads its key from `FIREBASE_KEY_FILE` in `backend/.env`, not from a machine-wide
  `GOOGLE_APPLICATION_CREDENTIALS`, and refuses a key that belongs to another project.
- After changing `firestore.rules` or `firestore.indexes.json`: `cd backend && npm run deploy:firestore`.
- The e2e tests are pinned to the emulators in `backend/vitest.config.e2e.ts`, so they can never
  wipe the real database.
- The API still runs on your machine. To use the app away from it, deploy the API
  (for example to Cloud Run) and point `apiUrl` in `environment.ts` at it.
