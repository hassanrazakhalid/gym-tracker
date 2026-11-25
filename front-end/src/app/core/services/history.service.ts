import { computed, inject, Injectable, signal } from '@angular/core';
import { SetEntry, WorkoutSession } from '../models';
import { ApiService } from '../api/api.service';
import { Bests, bestsFor, flagPrSets } from '../logic/records';
import { isoDate } from '../util';

export interface ExerciseHistoryEntry {
  sessionId: string;
  sessionName: string;
  date: string;
  notes: string;
  sets: SetEntry[];
}

/**
 * Completed sessions, newest first. Every set of every session is kept, per
 * exercise, so "Previous" and PRs can always be resolved for any exercise.
 */
@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly api = inject(ApiService);

  readonly sessions = signal<WorkoutSession[]>([]);

  hydrate(sessions: WorkoutSession[]): void {
    this.sessions.set(sessions);
  }

  /** Local calendar dates (yyyy-mm-dd) with a finished workout. */
  readonly workoutDates = computed(() => new Set(this.sessions().map((s) => isoDate(new Date(s.startedAt)))));

  /** Finished workouts on a local calendar date. */
  sessionsOn(date: string): WorkoutSession[] {
    return this.sessions().filter((s) => isoDate(new Date(s.startedAt)) === date);
  }

  session(id: string): WorkoutSession | undefined {
    return this.sessions().find((s) => s.id === id);
  }

  /** Sets from the most recent completed session that included this exercise. */
  previousSets(exerciseId: string): SetEntry[] {
    for (const s of this.sessions()) {
      const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
      if (ex) return ex.sets.filter((x) => x.completed);
    }
    return [];
  }

  historyFor(exerciseId: string): ExerciseHistoryEntry[] {
    const out: ExerciseHistoryEntry[] = [];
    for (const s of this.sessions()) {
      for (const ex of s.exercises) {
        if (ex.exerciseId !== exerciseId) continue;
        out.push({ sessionId: s.id, sessionName: s.name, date: s.startedAt, notes: ex.notes, sets: ex.sets });
      }
    }
    return out;
  }

  bests(exerciseId: string): Bests | null {
    return bestsFor(exerciseId, this.sessions());
  }

  /**
   * Saves a finished session. It shows in history straight away; the server
   * stores it and works out PRs. Rejects (and removes it again) if the save fails.
   */
  async save(session: WorkoutSession): Promise<void> {
    this.sessions.update((list) => [session, ...list.filter((s) => s.id !== session.id)]);
    try {
      const { session: stored } = await this.api.post<{ session: WorkoutSession | null }>('/sessions', session);
      if (stored) this.sessions.update((list) => list.map((s) => (s.id === stored.id ? stored : s)));
    } catch (err) {
      this.sessions.update((list) => list.filter((s) => s.id !== session.id));
      throw err;
    }
  }

  /** Sessions that happened before the given one (for judging its PRs). */
  sessionsBefore(session: WorkoutSession): WorkoutSession[] {
    return this.sessions().filter((s) => s.id !== session.id && s.startedAt < session.startedAt);
  }

  /** PR set ids per session, replayed oldest to newest across the whole history. */
  readonly prSets = computed(() => {
    const out = new Map<string, Set<string>>();
    const prior: WorkoutSession[] = [];
    for (const s of [...this.sessions()].reverse()) {
      out.set(s.id, new Set(flagPrSets(s, prior).keys()));
      prior.push(s);
    }
    return out;
  });

  prCountFor(sessionId: string): number {
    return this.prSets().get(sessionId)?.size ?? 0;
  }

  isPrSet(sessionId: string, setId: string): boolean {
    return this.prSets().get(sessionId)?.has(setId) ?? false;
  }
}
