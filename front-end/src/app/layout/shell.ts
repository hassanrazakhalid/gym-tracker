import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ClockService } from '../core/services/clock.service';
import { SessionService } from '../core/services/session.service';
import { formatDuration } from '../core/util';
import { Icon, IconName } from '../shared/icon';

interface Tab {
  path: string;
  label: string;
  icon: IconName;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.has-resume]': '!!session.active()' },
  template: `
    <main><router-outlet /></main>

    @if (session.active(); as s) {
      <a class="resume" routerLink="/session">
        <span class="resume__live" aria-hidden="true"></span>
        <span class="resume__text">
          <strong>{{ s.name }}</strong> in progress, {{ elapsed() }}
        </span>
        <span class="resume__cta">Resume</span>
      </a>
    }

    <nav class="tabs" aria-label="Main">
      @for (t of tabs; track t.path) {
        <a
          class="tab"
          [routerLink]="t.path"
          routerLinkActive="tab--active"
          #rla="routerLinkActive"
          [attr.aria-current]="rla.isActive ? 'page' : null"
        >
          <app-icon [name]="t.icon" [size]="22" />
          <span>{{ t.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: `
    :host { display: block; }
    .tabs {
      position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 100%; max-width: var(--app-w);
      height: calc(var(--nav-h) + env(safe-area-inset-bottom));
      padding-bottom: env(safe-area-inset-bottom);
      display: grid; grid-template-columns: repeat(5, 1fr);
      background: var(--surface);
      border-top: 1px solid var(--line);
      z-index: 20;
    }
    .tab {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
      text-decoration: none; color: var(--ink-3); font-size: 12px; font-weight: 600;
    }
    .tab--active { color: var(--ink); }
    .tab--active app-icon { color: var(--blue); }
    .resume {
      position: fixed; left: 50%; transform: translateX(-50%);
      bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + 10px);
      width: calc(100% - 2 * var(--pad)); max-width: calc(var(--app-w) - 2 * var(--pad));
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; border-radius: var(--r-m);
      background: var(--ink); color: #fff; text-decoration: none; z-index: 19;
      box-shadow: 0 6px 18px rgba(27, 33, 48, 0.25);
    }
    .resume__live {
      width: 9px; height: 9px; border-radius: 50%; background: var(--green);
      box-shadow: 0 0 0 4px rgba(46, 154, 90, 0.3);
    }
    .resume__text { flex: 1; font-size: 15px; }
    .resume__cta { font-weight: 700; color: #9fbcff; }
  `,
})
export class Shell {
  protected readonly session = inject(SessionService);
  private readonly clock = inject(ClockService);

  protected readonly tabs: Tab[] = [
    { path: '/lessons', label: 'Lessons', icon: 'book' },
    { path: '/nutrition', label: 'Nutrition', icon: 'apple' },
    { path: '/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/workout', label: 'Workout', icon: 'dumbbell' },
    { path: '/progress', label: 'Progress', icon: 'chart' },
  ];

  protected readonly elapsed = computed(() => {
    const s = this.session.active();
    return s ? formatDuration((this.clock.now() - Date.parse(s.startedAt)) / 1000) : '';
  });
}
