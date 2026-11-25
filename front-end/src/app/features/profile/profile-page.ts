import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { describeError } from '../../core/api/api.service';
import { AuthService } from '../../core/api/auth.service';
import { DataService } from '../../core/services/data.service';
import { SettingsService } from '../../core/services/settings.service';
import { Sheet } from '../../shared/sheet';

type Confirm = 'sample' | 'delete' | null;

@Component({
  selector: 'app-profile-page',
  imports: [Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div>
        <h1 class="page-title">Profile</h1>
        @if (data.email()) { <p class="muted">Signed in as {{ data.email() }}</p> }
      </div>

      <section class="panel stack">
        <label class="field">
          <span class="field__label">Your name</span>
          <input class="input" [value]="settings.name()" (change)="setName($any($event.target).value)" />
        </label>

        <div class="field">
          <span class="field__label">Weight unit</span>
          <div class="segmented" role="group" aria-label="Weight unit">
            <button type="button" [attr.aria-pressed]="settings.unit() === 'lb'" (click)="settings.update({ unit: 'lb' })">Pounds (lbs)</button>
            <button type="button" [attr.aria-pressed]="settings.unit() === 'kg'" (click)="settings.update({ unit: 'kg' })">Kilograms (kg)</button>
          </div>
          <span class="faint hint">Applies everywhere, including past workouts.</span>
        </div>

        <label class="field">
          <span class="field__label">Daily step goal</span>
          <input class="input" inputmode="numeric" [value]="settings.stepGoal()" (change)="setSteps($any($event.target).value)" />
        </label>
      </section>

      <section class="panel stack">
        <h2 class="section-title">Your data</h2>
        <p class="muted">Try the app with about nine weeks of sample workouts, weigh-ins and meals. This replaces what's in your account.</p>
        <button type="button" class="btn" (click)="confirm.set('sample')">Load sample data</button>
        <button type="button" class="btn btn--danger" (click)="confirm.set('delete')">Delete all my data</button>
      </section>

      <button type="button" class="btn btn--dark btn--block btn--lg" (click)="signOut()">Sign out</button>
    </div>

    <app-sheet [open]="confirm() !== null" [title]="confirm() === 'sample' ? 'Load sample data?' : 'Delete all your data?'" (closed)="confirm.set(null)">
      <p class="muted copy">
        @if (confirm() === 'sample') {
          Your workouts, weigh-ins, food log, photos and plan are replaced with sample data. This can't be undone.
        } @else {
          Your workouts, weigh-ins, food log, photos and plan are deleted for good. Your account stays, so you can start fresh.
        }
      </p>
      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      <div class="stack">
        <button type="button" class="btn btn--block btn--lg" [class.btn--primary]="confirm() === 'sample'"
          [class.btn--danger]="confirm() === 'delete'" [disabled]="busy()" (click)="run()">
          {{ busy() ? 'Working…' : confirm() === 'sample' ? 'Replace with sample data' : 'Delete all my data' }}
        </button>
        <button type="button" class="btn btn--block" (click)="confirm.set(null)">Cancel</button>
      </div>
    </app-sheet>
  `,
  styles: `
    .hint { font-size: 13px; }
    .copy { margin-bottom: 16px; }
    .section-title { margin-bottom: 0; }
    .error { color: var(--red); font-weight: 600; margin-bottom: 12px; }
  `,
})
export class ProfilePage {
  protected readonly settings = inject(SettingsService);
  protected readonly data = inject(DataService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly confirm = signal<Confirm>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected setName(v: string): void {
    const name = v.trim();
    if (name) this.settings.update({ name });
  }

  protected setSteps(v: string): void {
    const n = parseInt(v, 10);
    if (Number.isFinite(n) && n >= 100) this.settings.update({ stepGoal: n });
  }

  protected async run(): Promise<void> {
    const action = this.confirm();
    this.busy.set(true);
    this.error.set('');
    try {
      if (action === 'sample') await this.data.loadSampleData();
      else if (action === 'delete') await this.data.deleteAllData();
      this.confirm.set(null);
      await this.router.navigateByUrl('/dashboard');
    } catch (err) {
      this.error.set(describeError(err, action === 'sample' ? "Couldn't load sample data." : "Couldn't delete your data."));
    } finally {
      this.busy.set(false);
    }
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }
}
