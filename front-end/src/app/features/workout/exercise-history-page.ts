import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { estimatedOneRepMax } from '../../core/logic/records';
import { HistoryService } from '../../core/services/history.service';
import { LibraryService } from '../../core/services/library.service';
import { SettingsService } from '../../core/services/settings.service';
import { ExerciseThumb } from '../../shared/exercise-thumb';
import { Icon } from '../../shared/icon';
import { LineChart } from '../../shared/line-chart';

@Component({
  selector: 'app-exercise-history-page',
  imports: [Icon, ExerciseThumb, LineChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <button type="button" class="btn btn--ghost back" (click)="location.back()"><app-icon name="chevron-left" />Back</button>

      <header class="head">
        <app-exercise-thumb [exercise]="exercise()" />
        <div>
          <h1 class="page-title">{{ exercise().name }}</h1>
          <p class="muted">{{ exercise().muscle }}, {{ exercise().equipment.toLowerCase() }}, {{ exercise().repRange.min }}–{{ exercise().repRange.max }} reps</p>
        </div>
      </header>

      @if (bests(); as b) {
        <dl class="bests panel">
          <div><dt>Heaviest</dt><dd class="num">{{ settings.formatWeight(b.weight) }}<small>{{ settings.unitLabel() }}</small></dd></div>
          <div><dt>Most reps</dt><dd class="num">{{ b.reps }}</dd></div>
          <div><dt>Best set</dt><dd class="num">{{ bestSet() }}</dd></div>
        </dl>
      }

      @if (chart().length > 1) {
        <section class="panel">
          <div class="spread">
            <h2 class="section-title">Estimated 1-rep max</h2>
            <span class="num trend">{{ settings.formatWeight(chartLatest()) }} {{ settings.unitLabel() }}</span>
          </div>
          <app-line-chart [points]="chart()" label="Estimated one-rep max over time" />
        </section>
      }

      <section>
        <h2 class="section-title">Sessions</h2>
        @for (h of entries(); track h.sessionId + h.date) {
          <article class="panel session">
            <div class="spread">
              <strong>{{ h.sessionName }}</strong>
              <span class="faint">{{ h.dateLabel }}</span>
            </div>
            @if (h.notes) { <p class="notes">{{ h.notes }}</p> }
            <ol class="sets">
              @for (s of h.sets; track s.id) {
                <li>
                  <span class="set-n">{{ s.setNumber }}</span>
                  <span class="num">{{ settings.formatWeight(s.weightKg) }} × {{ s.reps }}</span>
                  <span [class]="'pip pip--' + s.effort"></span>
                </li>
              }
            </ol>
          </article>
        } @empty {
          <p class="muted">No history yet. Log this exercise once and your sets will show up here.</p>
        }
      </section>
    </div>
  `,
  styles: `
    .back { align-self: flex-start; margin-left: -10px; }
    .head { display: flex; align-items: center; gap: 14px; --thumb: 56px; }
    .head .page-title { font-size: 30px; }
    .bests { display: grid; grid-template-columns: repeat(3, 1fr); margin: 0; }
    .bests dt { font-size: 13px; font-weight: 600; color: var(--ink-2); }
    .bests dd { margin: 0; font-size: 28px; }
    .bests small { font-size: 14px; color: var(--ink-2); margin-left: 3px; }
    .trend { font-size: 20px; color: var(--blue); }
    .session { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; padding: 12px 14px; }
    .notes { font-size: 14px; color: var(--ink-2); }
    .sets { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 16px; }
    .sets li { display: inline-flex; align-items: center; gap: 6px; font-size: 18px; }
    .set-n { font-size: 13px; color: var(--ink-3); font-weight: 600; }
  `,
})
export class ExerciseHistoryPage {
  protected readonly settings = inject(SettingsService);
  protected readonly location = inject(Location);
  private readonly library = inject(LibraryService);
  private readonly history = inject(HistoryService);

  readonly id = input.required<string>();

  protected readonly exercise = computed(() => this.library.exercise(this.id()));
  protected readonly bests = computed(() => this.history.bests(this.id()));

  protected readonly entries = computed(() =>
    this.history.historyFor(this.id()).map((h) => ({
      ...h,
      dateLabel: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    })),
  );

  protected readonly bestSet = computed(() => {
    let best: { w: number; r: number } | null = null;
    for (const h of this.history.historyFor(this.id())) {
      for (const s of h.sets) {
        const w = s.weightKg ?? 0;
        const r = s.reps ?? 0;
        if (!best || w * r > best.w * best.r) best = { w, r };
      }
    }
    return best ? `${this.settings.formatWeight(best.w)} × ${best.r}` : '–';
  });

  protected readonly chart = computed(() =>
    this.history
      .historyFor(this.id())
      .map((h) => ({
        x: Date.parse(h.date),
        y: Math.max(...h.sets.map((s) => estimatedOneRepMax(s.weightKg ?? 0, s.reps ?? 0))),
      }))
      .filter((p) => p.y > 0)
      .reverse(),
  );

  protected readonly chartLatest = computed(() => this.chart().at(-1)?.y ?? null);
}
