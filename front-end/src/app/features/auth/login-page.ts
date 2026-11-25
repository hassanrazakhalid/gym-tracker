import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { authErrorMessage, AuthService } from '../../core/api/auth.service';
import { DataService } from '../../core/services/data.service';
import { SettingsService } from '../../core/services/settings.service';

type Mode = 'sign-in' | 'sign-up';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="login">
      <header class="brand">
        <span class="plates" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <h1 class="brand__name">Workout Tracker</h1>
        <p class="muted">Log every set. Beat last time.</p>
      </header>

      <form class="panel stack form" (submit)="submit($event)" novalidate>
        <div class="segmented" role="group" aria-label="Sign in or create an account">
          <button type="button" [attr.aria-pressed]="mode() === 'sign-in'" (click)="setMode('sign-in')">Sign in</button>
          <button type="button" [attr.aria-pressed]="mode() === 'sign-up'" (click)="setMode('sign-up')">Create account</button>
        </div>

        @if (mode() === 'sign-up') {
          <label class="field">
            <span class="field__label">Your name</span>
            <input class="input" autocomplete="given-name" [value]="name()" (input)="name.set($any($event.target).value)" />
          </label>
        }
        <label class="field">
          <span class="field__label">Email</span>
          <input class="input" type="email" autocomplete="email" inputmode="email" required
            [value]="email()" (input)="email.set($any($event.target).value)" />
        </label>
        <label class="field">
          <span class="field__label">Password</span>
          <input class="input" type="password" required
            [attr.autocomplete]="mode() === 'sign-in' ? 'current-password' : 'new-password'"
            [value]="password()" (input)="password.set($any($event.target).value)" />
          @if (mode() === 'sign-up') { <span class="faint hint">At least 6 characters.</span> }
        </label>

        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        @if (info()) { <p class="info" role="status">{{ info() }}</p> }

        <button type="submit" class="btn btn--primary btn--lg btn--block" [disabled]="busy()">
          {{ busy() ? 'One moment…' : mode() === 'sign-in' ? 'Sign in' : 'Create account' }}
        </button>
        @if (mode() === 'sign-in') {
          <button type="button" class="btn btn--ghost" (click)="forgot()">Forgot password?</button>
        }
      </form>
    </main>
  `,
  styles: `
    .login {
      min-height: 100dvh; padding: 48px var(--pad) 32px;
      display: flex; flex-direction: column; gap: 28px; justify-content: center;
    }
    .brand { display: flex; flex-direction: column; gap: 6px; }
    .brand__name { font-size: 48px; line-height: 0.95; }
    /* Four bumper plates, the app's palette in one line. */
    .plates { display: flex; gap: 5px; margin-bottom: 10px; }
    .plates i { width: 10px; height: 38px; border-radius: 3px; }
    .plates i:nth-child(1) { background: var(--red); }
    .plates i:nth-child(2) { background: var(--blue); }
    .plates i:nth-child(3) { background: var(--yellow); }
    .plates i:nth-child(4) { background: var(--green); }
    .form { padding: 18px; }
    .hint { font-size: 13px; }
    .error { color: var(--red); font-weight: 600; font-size: 15px; }
    .info { color: var(--green); font-weight: 600; font-size: 15px; }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly data = inject(DataService);
  private readonly settings = inject(SettingsService);
  private readonly router = inject(Router);

  protected readonly mode = signal<Mode>('sign-in');
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');
  protected readonly info = signal('');
  protected readonly busy = signal(false);

  protected setMode(m: Mode): void {
    this.mode.set(m);
    this.error.set('');
    this.info.set('');
  }

  protected async submit(e: Event): Promise<void> {
    e.preventDefault();
    this.error.set('');
    this.info.set('');
    if (!this.email().trim() || !this.password()) {
      this.error.set('Enter your email and password.');
      return;
    }
    this.busy.set(true);
    try {
      if (this.mode() === 'sign-in') {
        await this.auth.signIn(this.email(), this.password());
        await this.data.ensureLoaded();
      } else {
        await this.auth.signUp(this.email(), this.password());
        await this.data.ensureLoaded();
        const name = this.name().trim();
        if (name) this.settings.update({ name });
      }
      await this.router.navigateByUrl('/dashboard');
    } catch (err) {
      this.error.set((err as { code?: string }).code ? authErrorMessage(err) : this.data.error() ?? authErrorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }

  protected async forgot(): Promise<void> {
    this.error.set('');
    if (!this.email().trim()) {
      this.error.set('Enter your email first, then tap Forgot password.');
      return;
    }
    try {
      await this.auth.resetPassword(this.email());
      this.info.set('Check your email for a link to reset your password.');
    } catch (err) {
      this.error.set(authErrorMessage(err));
    }
  }
}
