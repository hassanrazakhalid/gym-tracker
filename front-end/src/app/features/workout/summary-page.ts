import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HistoryService } from '../../core/services/history.service';
import { LibraryService } from '../../core/services/library.service';
import { SettingsService } from '../../core/services/settings.service';
import { formatWorkoutLength } from '../../core/util';
import { ExerciseThumb } from '../../shared/exercise-thumb';
import { Icon } from '../../shared/icon';

/** Shown straight after finishing a workout, and for any past workout. */
@Component({
  selector: 'app-summary-page',
  imports: [RouterLink, Icon, ExerciseThumb],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <a routerLink="/workout" class="btn btn--ghost back"><app-icon name="chevron-left" />Workout</a>

      @if (view(); as v) {
        <header>
          <p class="when">{{ v.date }}</p>
          <h1 class="page-title">{{ justFinished() ? v.name + ' done' : v.name }}</h1>
        </header>

        <dl class="stats panel">
          <div><dt>Time</dt><dd class="num">{{ v.duration }}</dd></div>
          <div><dt>Sets</dt><dd class="num">{{ v.sets }}</dd></div>
          <div><dt>Lifted</dt><dd class="num">{{ v.volume }}<small>{{ settings.unitLabel() }}</small></dd></div>
          <div class="stats__pr" [class.stats__pr--none]="!v.prCount">
            <dt>Records</dt><dd class="num"><app-icon name="trophy" [size]="20" />{{ v.prCount }}</dd>
          </div>
        </dl>

        @for (ex of v.exercises; track ex.id) {
          <section class="panel ex">
            <a class="ex__head" [routerLink]="['/exercise', ex.exercise.id]">
              <app-exercise-thumb [exercise]="ex.exercise" />
              <span class="ex__name">{{ ex.exercise.name }}</span>
              <app-icon name="chevron-right" class="faint" />
            </a>
            @if (ex.notes) { <p class="ex__notes">{{ ex.notes }}</p> }
            <ol class="sets">
              @for (s of ex.sets; track s.id) {
                <li class="set" [class.set--pr]="s.pr">
                  <span class="set__n">
                    @if (s.pr) { <app-icon name="trophy" [size]="16" /> } @else { {{ s.setNumber }} }
                  </span>
                  <span class="num set__v">{{ settings.formatWeight(s.weightKg) }} × {{ s.reps }}</span>
                  <span [class]="'pip pip--' + s.effort"></span>
                </li>
              }
            </ol>
          </section>
        }
      } @else {
        <p class="muted">This workout couldn't be found. It may have been removed.</p>
      }
    </div>
  `,
  styles: `
    .back { align-self: flex-start; margin-left: -10px; }
    .when { font-weight: 600; color: var(--blue); }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 0; }
    .stats div { display: flex; flex-direction: column; gap: 2px; }
    .stats dt { font-size: 13px; color: var(--ink-2); font-weight: 600; }
    .stats dd { margin: 0; font-size: 26px; display: flex; align-items: center; gap: 3px; }
    .stats small { font-size: 14px; color: var(--ink-2); margin-left: 2px; }
    .stats__pr dd { color: var(--gold); }
    .stats__pr--none dd { color: var(--ink-3); }
    .ex { padding: 12px 14px; }
    .ex__head { display: flex; align-items: center; gap: 12px; text-decoration: none; --thumb: 36px; }
    .ex__name { flex: 1; font-family: var(--font-display); font-weight: 700; font-size: 20px; }
    .ex__notes { margin-top: 8px; font-size: 14px; color: var(--ink-2); }
    .sets { list-style: none; margin: 10px 0 0; padding: 0; }
    .set { display: flex; align-items: center; gap: 12px; min-height: 36px; border-top: 1px solid var(--line); padding: 0 4px; }
    .set--pr { background: var(--gold-soft); border-radius: 4px; }
    .set__n { width: 22px; text-align: center; font-family: var(--font-display); font-weight: 700; color: var(--ink-2); display: inline-flex; justify-content: center; }
    .set--pr .set__n { color: var(--gold); }
    .set__v { flex: 1; font-size: 19px; }
  `,
})
export class SummaryPage {
  protected readonly settings = inject(SettingsService);
  private readonly history = inject(HistoryService);
  private readonly library = inject(LibraryService);
  private readonly router = inject(Router);

  /** Route param. */
  readonly id = input.required<string>();

  protected readonly justFinished = computed(() => this.router.url.includes('/summary/'));

  protected readonly view = computed(() => {
    const s = this.history.session(this.id());
    if (!s) return null;
    const sets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
    const kg = s.exercises.reduce((t, e) => t + e.sets.reduce((u, x) => u + (x.weightKg ?? 0) * (x.reps ?? 0), 0), 0);
    return {
      name: s.name,
      date: new Date(s.startedAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
      duration: s.endedAt ? formatWorkoutLength((Date.parse(s.endedAt) - Date.parse(s.startedAt)) / 1000) : '–',
      sets,
      volume: Math.round(this.settings.toDisplay(kg) ?? 0).toLocaleString(),
      prCount: this.history.prCountFor(s.id),
      exercises: s.exercises.map((e) => ({
        id: e.id,
        notes: e.notes,
        exercise: this.library.exercise(e.exerciseId),
        sets: e.sets.map((x) => ({ ...x, pr: this.history.isPrSet(s.id, x.id) })),
      })),
    };
  });
}
