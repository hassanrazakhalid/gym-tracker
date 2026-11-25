import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';
import { BodyWeightService, GoalService } from '../../core/services/tracking.service';
import { parseIsoDate } from '../../core/util';
import { Icon } from '../../shared/icon';
import { LineChart } from '../../shared/line-chart';
import { LogWeightSheet } from '../tracking/log-weight-sheet';

@Component({
  selector: 'app-weight-page',
  imports: [RouterLink, Icon, LineChart, LogWeightSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <a routerLink="/progress" class="btn btn--ghost back"><app-icon name="chevron-left" />Progress</a>
      <div class="spread">
        <h1 class="page-title">Body weight</h1>
        <button type="button" class="btn btn--primary" (click)="logOpen.set(true)"><app-icon name="plus" [size]="18" />Log</button>
      </div>

      @if (summary(); as s) {
        <section class="panel">
          <dl class="figs">
            <div><dt>Current</dt><dd class="num">{{ s.current }}</dd></div>
            <div><dt>7-day average</dt><dd class="num">{{ s.avg }}</dd></div>
            <div><dt>Since goal start</dt><dd class="num">{{ s.sinceStart }}</dd></div>
          </dl>
          <app-line-chart [points]="points()" label="Body weight, last 90 days" style="--chart-h: 140px" />
          <p class="faint note">Daily weight swings with water and food. Watch the 7-day average.</p>
        </section>
      }

      <section class="panel panel--flush">
        @for (e of rows(); track e.id) {
          <div class="list-row">
            <div class="list-row__main">
              <div class="list-row__title num weight">{{ e.weight }} <small>{{ settings.unitLabel() }}</small></div>
              <div class="list-row__sub">{{ e.label }}</div>
            </div>
            @if (e.delta) { <span class="delta num" [class.delta--down]="e.down">{{ e.delta }}</span> }
            <button type="button" class="icon-btn" (click)="weights.remove(e.id)" [attr.aria-label]="'Delete entry from ' + e.label">
              <app-icon name="trash" [size]="18" />
            </button>
          </div>
        } @empty {
          <p class="list-row muted">Log your first weigh-in to start the trend.</p>
        }
      </section>
    </div>
    <app-log-weight-sheet [open]="logOpen()" (closed)="logOpen.set(false)" />
  `,
  styles: `
    .back { align-self: flex-start; margin-left: -10px; }
    .figs { display: grid; grid-template-columns: repeat(3, 1fr); margin: 0 0 14px; }
    .figs dt { font-size: 13px; color: var(--ink-2); font-weight: 600; }
    .figs dd { margin: 0; font-size: 26px; }
    .note { font-size: 13px; margin-top: 10px; }
    .weight { font-size: 22px; }
    .weight small { font-size: 14px; color: var(--ink-2); font-family: var(--font-body); font-weight: 500; }
    .delta { font-size: 16px; color: var(--ink-2); }
    .delta--down { color: var(--green); }
  `,
})
export class WeightPage {
  protected readonly settings = inject(SettingsService);
  protected readonly weights = inject(BodyWeightService);
  private readonly goals = inject(GoalService);

  protected readonly logOpen = signal(false);

  protected readonly points = computed(() =>
    this.weights.since(90).map((e) => ({ x: Date.parse(e.date), y: this.settings.toDisplay(e.weightKg) ?? 0 })),
  );

  protected readonly summary = computed(() => {
    const list = this.weights.entries();
    if (!list.length) return null;
    const unit = this.settings.unitLabel();
    const last7 = list.slice(0, 7);
    const avg = last7.reduce((t, e) => t + e.weightKg, 0) / last7.length;
    const diff = (this.settings.toDisplay(list[0].weightKg) ?? 0) - (this.settings.toDisplay(this.goals.goal().startingWeightKg) ?? 0);
    return {
      current: `${this.settings.formatWeight(list[0].weightKg)} ${unit}`,
      avg: `${this.settings.formatWeight(avg)} ${unit}`,
      sinceStart: `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${Math.abs(diff).toFixed(1)} ${unit}`,
    };
  });

  protected readonly rows = computed(() => {
    const list = this.weights.entries().slice(0, 60);
    return list.map((e, i) => {
      const prev = list[i + 1];
      const d = prev ? (this.settings.toDisplay(e.weightKg) ?? 0) - (this.settings.toDisplay(prev.weightKg) ?? 0) : 0;
      return {
        id: e.id,
        weight: this.settings.formatWeight(e.weightKg),
        label: parseIsoDate(e.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        delta: prev && Math.abs(d) >= 0.05 ? `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}` : '',
        down: d < 0,
      };
    });
  });
}
