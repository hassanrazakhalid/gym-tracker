import { inject, Injectable, signal } from '@angular/core';
import { ApiService, NotifyService } from '../api/api.service';
import { Exercise, MuscleGroup, Routine } from '../models';
import { EXERCISES } from '../content/exercises';
import { mediaFor } from '../content/media';
import { ROUTINES } from '../content/routines';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Adductors', 'Calves', 'Core',
];

/** Exercise library and routines. Read-only for now; the API will serve these. */
@Injectable({ providedIn: 'root' })
export class LibraryService {
  readonly exercises: Exercise[] = EXERCISES.map(({ startLb: _startLb, ...e }) => ({ ...e, media: mediaFor(e.id) }));
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);

  /** The user's routines: the built-in ones with their edits (swaps on the preview page). */
  readonly routines = signal<Routine[]>(structuredClone(ROUTINES));

  hydrate(routines: Routine[]): void {
    this.routines.set(routines);
  }
  private readonly byId = new Map(this.exercises.map((e) => [e.id, e]));

  exercise(id: string): Exercise {
    const e = this.byId.get(id);
    if (!e) throw new Error(`Unknown exercise ${id}`);
    return e;
  }

  routine(id: string): Routine | undefined {
    return this.routines().find((r) => r.id === id);
  }

  /** Replaces one exercise in a routine, keeping its set count and superset position. */
  swapInRoutine(routineId: string, blockIndex: number, exerciseIndex: number, newExerciseId: string): void {
    const before = this.routines();
    const current = before.find((r) => r.id === routineId);
    if (!current) return;
    const copy = structuredClone(current);
    const target = copy.blocks[blockIndex]?.exercises[exerciseIndex];
    if (!target) return;
    target.exerciseId = newExerciseId;
    this.routines.set(before.map((r) => (r.id === routineId ? copy : r)));
    this.api.put(`/routines/${routineId}`, copy).catch((err) => {
      this.routines.set(before);
      this.notify.saveFailed(err, 'the routine');
    });
  }

  /** The built-in exercise a swapped one replaced, for "Swapped from …" notes. */
  originalAt(routineId: string, blockIndex: number, exerciseIndex: number): Exercise | null {
    const id = ROUTINES.find((r) => r.id === routineId)?.blocks[blockIndex]?.exercises[exerciseIndex]?.exerciseId;
    return id ? this.exercise(id) : null;
  }

  restoreRoutine(routineId: string): void {
    const original = ROUTINES.find((r) => r.id === routineId);
    if (!original) return;
    const before = this.routines();
    this.routines.set(before.map((r) => (r.id === routineId ? structuredClone(original) : r)));
    this.api.delete(`/routines/${routineId}`).catch((err) => {
      this.routines.set(before);
      this.notify.saveFailed(err, 'the routine');
    });
  }

  /** Recommended first (curated substitutes), then the rest of the same muscle group. */
  alternativesFor(id: string): { recommended: Exercise[]; other: Exercise[] } {
    const ex = this.exercise(id);
    const recommended = ex.alternatives.map((a) => this.exercise(a));
    const taken = new Set([id, ...ex.alternatives]);
    const other = this.exercises.filter((e) => e.muscle === ex.muscle && !taken.has(e.id));
    return { recommended, other };
  }
}
