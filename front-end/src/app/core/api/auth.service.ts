import { Injectable, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  Auth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { environment } from '../../../environments/environment';

/** Firebase Authentication: who is signed in, and their ID token for the API. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth: Auth;

  /** Undefined until Firebase has restored any saved sign-in. */
  readonly user = signal<User | null | undefined>(undefined);
  private readonly ready: Promise<User | null>;

  constructor() {
    const app = initializeApp(environment.firebase);
    this.auth = getAuth(app);
    if (environment.authEmulatorUrl) {
      connectAuthEmulator(this.auth, environment.authEmulatorUrl, { disableWarnings: true });
    }
    this.ready = new Promise((resolve) => {
      const stop = onAuthStateChanged(this.auth, (u) => {
        stop();
        resolve(u);
      });
    });
    onAuthStateChanged(this.auth, (u) => this.user.set(u));
  }

  /** Resolves once the saved sign-in (if any) has been restored. */
  whenReady(): Promise<User | null> {
    return this.ready;
  }

  async token(): Promise<string | null> {
    await this.ready;
    return this.auth.currentUser ? this.auth.currentUser.getIdToken() : null;
  }

  async signIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email.trim(), password);
  }

  async signUp(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email.trim(), password);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email.trim());
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }
}

/** Plain-language messages for Firebase Auth error codes. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address doesn\'t look right.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead.';
    case 'auth/weak-password':
      return 'Use a password of at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a minute, then try again.';
    case 'auth/network-request-failed':
      return 'Can\'t reach the sign-in service. Check your connection.';
    default:
      return 'Something went wrong signing in. Try again.';
  }
}
