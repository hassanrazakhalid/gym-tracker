import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotifyService } from './core/api/api.service';
import { DataService } from './core/services/data.service';
import { PwaService } from './core/services/pwa.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-frame">
      @if (data.status() === 'error') {
        <div class="load-error" role="alert">
          <p>{{ data.error() }}</p>
          <button type="button" class="btn btn--dark" (click)="retry()">Try again</button>
        </div>
      }
      <router-outlet />
    </div>
    @if (pwa.updateReady()) {
      <div class="update" role="status">
        <span>A new version of the app is ready.</span>
        <button type="button" class="btn btn--primary" (click)="pwa.applyUpdate()">Reload</button>
      </div>
    }
    @if (notify.message(); as m) {
      <div class="toast" role="status">
        <span>{{ m }}</span>
        <button type="button" class="toast__close" (click)="notify.dismiss()" aria-label="Dismiss">×</button>
      </div>
    }
  `,
  styles: `
    .load-error {
      margin: 16px var(--pad) 0; padding: 14px 16px; border-radius: var(--r-m);
      background: #fdecea; color: var(--ink); display: flex; flex-direction: column; gap: 10px; align-items: flex-start;
    }
    .toast {
      position: fixed; left: 50%; transform: translateX(-50%);
      top: calc(env(safe-area-inset-top) + 12px);
      width: calc(100% - 2 * var(--pad)); max-width: calc(var(--app-w) - 2 * var(--pad));
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 14px; border-radius: var(--r-m);
      background: var(--ink); color: #fff; z-index: 100;
      box-shadow: 0 8px 24px rgba(27, 33, 48, 0.3);
      font-size: 15px;
    }
    .toast span { flex: 1; }
    .update {
      position: fixed; left: 50%; transform: translateX(-50%);
      bottom: calc(env(safe-area-inset-bottom) + 84px);
      width: calc(100% - 2 * var(--pad)); max-width: calc(var(--app-w) - 2 * var(--pad));
      display: flex; align-items: center; gap: 12px;
      padding: 10px 10px 10px 16px; border-radius: var(--r-m);
      background: var(--ink); color: #fff; z-index: 90; font-size: 15px;
      box-shadow: 0 8px 24px rgba(27, 33, 48, 0.3);
    }
    .update span { flex: 1; }
    .toast__close { border: 0; background: none; color: #fff; font-size: 22px; line-height: 1; padding: 0 2px; }
  `,
})
export class App {
  // Created here so it starts following sign-in state immediately.
  protected readonly data = inject(DataService);
  protected readonly notify = inject(NotifyService);
  // Created here so it catches the browser's install offer and new versions.
  protected readonly pwa = inject(PwaService);

  protected retry(): void {
    this.data.load().catch(() => undefined);
  }
}
