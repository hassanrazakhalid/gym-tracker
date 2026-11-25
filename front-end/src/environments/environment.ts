/**
 * The real Firebase project (gym-tracker-67e17). This web config is public by design:
 * it identifies the project, and access is enforced by Firebase Auth and the API.
 * For local work against the emulators, run `npm run start:emu` instead.
 */
export const environment = {
  apiUrl: 'http://localhost:3000/api',
  firebase: {
    apiKey: 'AIzaSyBZ0CiyyuYmJslp6kjceN4zm7dfalbYHRY',
    authDomain: 'gym-tracker-67e17.firebaseapp.com',
    projectId: 'gym-tracker-67e17',
    storageBucket: 'gym-tracker-67e17.firebasestorage.app',
    messagingSenderId: '340438209406',
    appId: '1:340438209406:web:ff59724847ae64473ed92f',
  },
  authEmulatorUrl: null as string | null,
};
