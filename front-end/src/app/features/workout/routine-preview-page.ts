import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { guidanceFor } from '../../core/logic/progression';
import { HistoryService } from '../../core/services/history.service';
import { LibraryService } from '../../core/services/library.service';
import { PlanService } from '../../core/services/plan.service';
import { SessionService } from '../../core/services/session.service';
import { SettingsService } from '../../core/services/settings.service';
import { formatClock } from '../../core/util';
import { ExerciseThumb } from '../../shared/exercise-thumb';
import { ExercisePicker } from '../../shared/exercise-picker';
import { Icon } from '../../shared/icon';

/** Look at a routine before (or instead of) starting it. */
@Component({
  selector: 'app-routine-preview-page',
  imports: [RouterLink, Icon, ExerciseThumb, ExercisePicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './routine-preview-page.html',
  styleUrl: './routine-preview-page.scss',
})
export class RoutinePreviewPage {
  protected readonly session = inject(SessionService);
  protected readonly settings = inject(SettingsService);
  protected readonly location = inject(Location);
  protected readonly library = inject(LibraryService);
  private readonly history = inject(HistoryService);
  private readonly plan = inject(PlanService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly formatClock = formatClock;

  /** Which exercise slot the swap picker is open for. */
  protected readonly swapping = signal<{ block: number; index: number; exerciseId: string } | null>(null);

  protected readonly routine = computed(() => this.library.routine(this.id()) ?? null);

  /** Weekdays this routine is planned on, e.g. "Mondays and Fridays". */
  protected readonly scheduled = computed(() => {
    const days = this.plan
      .week()
      .map((id, i) => (id === this.id() ? i : -1))
      .filter((i) => i >= 0)
      .map((i) => new Date(2024, 0, 7 + i).toLocaleDateString(undefined, { weekday: 'long' }) + 's');
    if (!days.length) return 'Not in your weekly plan';
    return 'Planned on ' + (days.length === 1 ? days[0] : days.slice(0, -1).join(', ') + ' and ' + days.at(-1));
  });

  protected readonly blocks = computed(() => {
    const r = this.routine();
    if (!r) return [];
    const inc = this.settings.incrementKg();
    return r.blocks.map((b, bi) => ({
      key: bi,
      restSeconds: b.restSeconds,
      isSuperset: b.exercises.length > 1,
      exercises: b.exercises.map((re, ei) => {
        const original = this.library.originalAt(r.id, bi, ei);
        const ex = this.library.exercise(re.exerciseId);
        const prev = this.history.previousSets(ex.id);
        const top = prev[0];
        const g = top && top.reps != null
          ? guidanceFor({ weightKg: top.weightKg ?? 0, reps: top.reps, effort: top.effort }, ex.repRange, inc)
          : null;
        let target = '';
        if (g?.target === 'reps') target = `${this.settings.formatWeight(top.weightKg)} × ${g.reps}`;
        else if (g?.target === 'weight') target = `${this.settings.formatWeight(g.weightKg)} × ${g.reps}`;
        else if (g?.target === 'hold') target = `${this.settings.formatWeight(top.weightKg)} × ${top.reps}`;
        return {
          ex,
          block: bi,
          index: ei,
          swappedFrom: original && original.id !== ex.id ? original.name : null,
          letter: b.exercises.length > 1 ? 'ABCDEFGH'[ei] : null,
          sets: re.sets,
          last: prev.map((s) => ({ id: s.id, text: `${this.settings.formatWeight(s.weightKg)} × ${s.reps}`, effort: s.effort })),
          target,
          direction: g && g.target !== 'hold' ? g.direction : null,
        };
      }),
    }));
  });

  protected readonly totals = computed(() => {
    const r = this.routine();
    if (!r) return { exercises: 0, sets: 0 };
    const all = r.blocks.flatMap((b) => b.exercises);
    return { exercises: all.length, sets: all.reduce((n, e) => n + e.sets, 0) };
  });

  protected readonly isCustomized = computed(() => this.blocks().some((b) => b.exercises.some((e) => e.swappedFrom)));

  /** Everything already in the routine, so the picker doesn't offer duplicates. */
  protected readonly inRoutine = computed(
    () => this.routine()?.blocks.flatMap((b) => b.exercises.map((e) => e.exerciseId)) ?? [],
  );

  protected onSwap(exerciseId: string): void {
    const s = this.swapping();
    if (s) this.library.swapInRoutine(this.id(), s.block, s.index, exerciseId);
    this.swapping.set(null);
  }

  protected restore(): void {
    this.library.restoreRoutine(this.id());
  }

  protected readonly runningThis = computed(() => this.session.active()?.routineId === this.id());

  protected start(): void {
    this.session.start(this.id());
    this.router.navigateByUrl('/session');
  }
}
