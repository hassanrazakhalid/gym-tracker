import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { Exercise } from '../../core/models';
import { buildWarmup, WarmupRound } from '../../core/logic/warmup';
import { ClockService } from '../../core/services/clock.service';
import { HistoryService } from '../../core/services/history.service';
import { LibraryService } from '../../core/services/library.service';
import { SessionService } from '../../core/services/session.service';
import { SettingsService } from '../../core/services/settings.service';
import { formatClock } from '../../core/util';
import { ExerciseThumb } from '../../shared/exercise-thumb';
import { Icon } from '../../shared/icon';

/**
 * Warm-up for a routine (`/workout/routines/:id/warmup`) or for the workout in
 * progress (`id` = "current"). Laid out like the session screen: one card per
 * move, one row per round, tick each off. Timed rounds count down and tick themselves.
 */
@Component({
  selector: 'app-warmup-page',
  imports: [Icon, ExerciseThumb],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './warmup-page.html',
  styleUrl: './warmup-page.scss',
})
export class WarmupPage {
  protected readonly settings = inject(SettingsService);
  protected readonly session = inject(SessionService);
  protected readonly location = inject(Location);
  private readonly library = inject(LibraryService);
  private readonly history = inject(HistoryService);
  private readonly clock = inject(ClockService);
  private readonly router = inject(Router);

  /** Routine id, or "current" for the workout in progress. */
  readonly id = input.required<string>();

  protected readonly done = signal<ReadonlySet<string>>(new Set());
  private readonly timer = signal<{ key: string; endsAt: number } | null>(null);

  protected readonly source = computed(() => {
    const id = this.id();
    if (id === 'current') {
      const s = this.session.active();
      return s ? { name: s.name, routineId: s.routineId, exercises: s.exercises.map((e) => this.library.exercise(e.exerciseId)) } : null;
    }
    const r = this.library.routine(id);
    if (!r) return null;
    return {
      name: r.name,
      routineId: r.id,
      exercises: r.blocks.flatMap((b) => b.exercises.map((e) => this.library.exercise(e.exerciseId))),
    };
  });

  protected readonly plan = computed(() => {
    const src = this.source();
    if (!src) return null;
    const first = src.exercises[0];
    const working = first ? Math.max(0, ...this.history.previousSets(first.id).map((s) => s.weightKg ?? 0)) : 0;
    return buildWarmup(src.exercises, working || null, this.settings.incrementKg());
  });

  protected readonly totalRounds = computed(
    () => this.plan()?.sections.flatMap((s) => s.items).reduce((n, i) => n + i.rounds.length, 0) ?? 0,
  );
  protected readonly doneCount = computed(() => this.done().size);
  protected readonly allDone = computed(() => this.totalRounds() > 0 && this.doneCount() >= this.totalRounds());

  /** Is this the routine of the workout already running? */
  protected readonly isRunning = computed(() => {
    const s = this.session.active();
    return !!s && (this.id() === 'current' || s.routineId === this.id());
  });

  protected readonly remaining = computed(() => {
    const t = this.timer();
    return t ? Math.max(0, (t.endsAt - this.clock.now()) / 1000) : 0;
  });

  constructor() {
    // A timed round ticks itself off when its countdown ends.
    effect(() => {
      const t = this.timer();
      if (t && this.clock.now() >= t.endsAt) {
        untracked(() => {
          this.mark(t.key, true);
          this.timer.set(null);
          if ('vibrate' in navigator) navigator.vibrate?.(150);
        });
      }
    });
  }

  protected key(itemId: string, i: number): string {
    return `${itemId}:${i}`;
  }

  protected isDone(itemId: string, i: number): boolean {
    return this.done().has(this.key(itemId, i));
  }

  protected toggle(itemId: string, i: number): void {
    const k = this.key(itemId, i);
    if (this.timer()?.key === k) this.timer.set(null);
    this.mark(k, !this.done().has(k));
  }

  private mark(k: string, on: boolean): void {
    this.done.update((s) => {
      const next = new Set(s);
      if (on) next.add(k);
      else next.delete(k);
      return next;
    });
  }

  protected isTiming(itemId: string, i: number): boolean {
    return this.timer()?.key === this.key(itemId, i);
  }

  protected startTimer(itemId: string, i: number, seconds: number): void {
    const k = this.key(itemId, i);
    if (this.timer()?.key === k) {
      this.timer.set(null); // tap again to stop
      return;
    }
    this.timer.set({ key: k, endsAt: Date.now() + seconds * 1000 });
  }

  protected target(r: WarmupRound): string {
    switch (r.kind) {
      case 'reps':
        return r.perSide ? `${r.reps} each side` : `${r.reps} reps`;
      case 'time':
        return r.seconds >= 60 ? `${Math.round(r.seconds / 60)} min` : `${r.seconds} sec`;
      case 'ramp':
        return `${this.settings.formatWeight(r.weightKg)} ${this.settings.unitLabel()} × ${r.reps}`;
    }
  }

  protected clockFor(): string {
    return formatClock(this.remaining());
  }

  protected exerciseFor(id: string | undefined): Exercise | null {
    return id ? this.library.exercise(id) : null;
  }

  protected start(): void {
    const id = this.source()?.routineId;
    if (!id) return;
    this.session.start(id);
    this.router.navigateByUrl('/session');
  }
}
