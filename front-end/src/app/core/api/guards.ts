import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { DataService } from '../services/data.service';
import { SessionService } from '../services/session.service';
import { AuthService } from './auth.service';

/**
 * Resolves to true once a user is signed in and their data has loaded, or to the
 * sign-in page. Call from a guard (it injects synchronously before awaiting).
 */
function signedInAndLoaded(): Promise<true | UrlTree> {
  const auth = inject(AuthService);
  const data = inject(DataService);
  const router = inject(Router);
  return (async () => {
    await auth.whenReady();
    if (!auth.user()) return router.parseUrl('/login');
    try {
      await data.ensureLoaded();
    } catch {
      // The app shows the error with a retry button.
    }
    return true as const;
  })();
}

/** Signed-in users only; waits for their data so screens render complete. */
export const authGuard: CanActivateFn = () => signedInAndLoaded();

/** The sign-in page is for signed-out users. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();
  return auth.user() ? router.parseUrl('/dashboard') : true;
};

/** The session screen needs a signed-in user with a workout in progress. */
export const activeSessionGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);
  const allowed = await signedInAndLoaded();
  if (allowed !== true) return allowed;
  return session.active() ? true : router.parseUrl('/workout');
};
