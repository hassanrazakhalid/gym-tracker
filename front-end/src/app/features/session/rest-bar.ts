import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RestTimerService } from '../../core/services/rest-timer.service';
import { formatClock } from '../../core/util';

/** Countdown docked at the bottom of the session screen while resting. */
@Component({
  selector: 'app-rest-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (rest.active()) {
      <section class="bar" aria-label="Rest timer">
        <div class="fill" [style.transform]="'scaleX(' + rest.fraction() + ')'"></div>
        <div class="content">
          <button type="button" class="adj" (click)="rest.adjust(-15)" aria-label="15 seconds less">−15</button>
          <div class="time">
            <span class="clock num" role="timer" aria-live="off">{{ clock() }}</span>
            <span class="label">{{ rest.label() }}</span>
          </div>
          <button type="button" class="adj" (click)="rest.adjust(15)" aria-label="15 seconds more">+15</button>
          <button type="button" class="skip" (click)="rest.skip()">Skip</button>
        </div>
      </section>
    }
  `,
  styles: `
    .bar {
      position: fixed; left: 50%; bottom: 0; transform: translateX(-50%);
      width: 100%; max-width: var(--app-w);
      background: var(--ink); color: #fff; z-index: 30;
      padding-bottom: env(safe-area-inset-bottom);
      overflow: hidden;
    }
    .fill {
      position: absolute; inset: 0; background: var(--blue);
      transform-origin: left center; transition: transform 0.25s linear;
    }
    .content { position: relative; display: flex; align-items: center; gap: 8px; padding: 10px 12px; }
    .time { flex: 1; display: flex; flex-direction: column; align-items: center; min-width: 0; }
    .clock { font-size: 40px; line-height: 1; font-weight: 700; }
    .label { font-size: 13px; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .adj, .skip {
      min-width: 54px; height: 44px; border-radius: var(--r-s); border: 0;
      background: rgba(255, 255, 255, 0.16); color: #fff;
      font-family: var(--font-display); font-weight: 700; font-size: 19px;
    }
    .skip { background: #fff; color: var(--ink); font-family: var(--font-body); font-size: 16px; padding: 0 14px; }
  `,
})
export class RestBar {
  protected readonly rest = inject(RestTimerService);
  protected readonly clock = computed(() => formatClock(this.rest.remaining()));
}
