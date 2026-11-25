import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Adds the signed-in user's Firebase ID token to API requests. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);
  const auth = inject(AuthService);
  return from(auth.token()).pipe(
    switchMap((token) => next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req)),
  );
};

/** Thin promise-based client for the NestJS API. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  get<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.base + path));
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.base + path, body));
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.put<T>(this.base + path, body));
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.patch<T>(this.base + path, body));
  }

  delete<T = void>(path: string): Promise<T> {
    return firstValueFrom(this.http.delete<T>(this.base + path));
  }
}

/**
 * One short message at a time at the bottom of the screen, for saves that fail.
 * Changes show on screen straight away; if the server rejects one, this explains why.
 */
@Injectable({ providedIn: 'root' })
export class NotifyService {
  readonly message = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  show(message: string): void {
    this.message.set(message);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.message.set(null), 6000);
  }

  dismiss(): void {
    this.message.set(null);
  }

  /** Reports a failed save in plain language. */
  saveFailed(err: unknown, what: string): void {
    console.error(`Saving ${what} failed`, err);
    this.show(describeError(err, `Couldn't save ${what}.`));
  }
}

export function describeError(err: unknown, prefix: string): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return `${prefix} The server can't be reached. Check that it's running and try again.`;
    if (err.status === 401) return `${prefix} Your sign-in has expired. Sign in again.`;
    const detail = Array.isArray(err.error?.message) ? err.error.message[0] : err.error?.message;
    if (detail) return `${prefix} ${detail}`;
  }
  return `${prefix} Try again.`;
}
