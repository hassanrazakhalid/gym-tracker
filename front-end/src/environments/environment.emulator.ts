/**
 * Local development against the emulators (`npm run start:emu`): the API on :3000
 * and the Firebase Auth emulator. No real accounts or data are touched.
 */
export const environment = {
  apiUrl: 'http://localhost:3000/api',
  firebase: {
    apiKey: 'demo-key',
    authDomain: 'demo-gym-tracker.firebaseapp.com',
    projectId: 'demo-gym-tracker',
  },
  authEmulatorUrl: 'http://127.0.0.1:9099' as string | null,
};
