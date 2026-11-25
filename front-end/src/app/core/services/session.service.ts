import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiService, describeError, NotifyService } from '../api/api.service';
import {
  Effort,
  SessionExercise,
  SessionGroup,
  SetEntry,
  WorkoutSession,
} from '../models';
import { flagPrSets } from '../logic/records';
import { uid } from '../util';
import { HistoryService } from './history.service';
import { LibraryService } from './library.service';
import { RestTimerService } from './rest-timer.service';

export interface ExerciseGroupView {
  group: SessionGroup;
  /** Index of the group in the session, for reorder controls. */
  index: number;
  exercises: SessionExercise[];
  isSuperset: boolean;
}

export const SUPERSET_LETTERS = 'ABCDEFGH';

function newSet(n: number): SetEntry {
  return { id: uid('set'), setNumber: n, weightKg: null, reps: null, effort: null, completed: false, completedAt: null };
}

/** The in-progress workout. Persisted so it survives closing and reopening the app. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly library = inject(LibraryService);
  private readonly history = inject(HistoryService);
  private readonly rest = inject(RestTimerService);

  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);

  /** The workout in progress. Saved to the server as it changes, so it can be resumed anywhere. */
  readonly active = signal<WorkoutSession | null>(null);

  /** Server writes run one after another, so a late save can't undo a finish or discard. */
  private chain: Promise<unknown> = Promise.resolve();
  private syncTimer: ReturnType<typeof setTimeout> | undefined;
  private syncErrorShown = false;

  hydrate(session: WorkoutSession | null): void {
    clearTimeout(this.syncTimer);
    this.active.set(session);
  }

  private enqueue(task: () => Promise<unknown>): Promise<unknown> {
    const next = this.chain.then(task);
    this.chain = next.catch(() => undefined);
    return next;
  }

  /** Saves the active workout shortly after the last change. */
  private queueSync(): void {
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      const snapshot = this.active();
      if (!snapshot) return;
      this.enqueue(() => this.api.put('/sessions/active', snapshot))
        .then(() => (this.syncErrorShown = false))
        .catch((err) => {
          // Keep working locally; tell the user once until a save succeeds again.
          if (!this.syncErrorShown) this.notify.saveFailed(err, 'your workout');
          this.syncErrorShown = true;
        });
    }, 400);
  }

  readonly groups = computed<ExerciseGroupView[]>(() => {
    const s = this.active();
    if (!s) return [];
    return s.groups.map((group, index) => {
      const exercises = s.exercises.filter((e) => e.groupId === group.id);
      return { group, index, exercises, isSuperset: exercises.length > 1 };
    });
  });

  readonly totalExercises = computed(() => this.active()?.exercises.length ?? 0);
  readonly doneExercises = computed(
    () => this.active()?.exercises.filter((e) => this.isExerciseDone(e)).length ?? 0,
  );
  /** 1-based position of the exercise the user is on. */
  readonly currentPosition = computed(() => {
    const list = this.active()?.exercises ?? [];
    const i = list.findIndex((e) => !this.isExerciseDone(e));
    return i === -1 ? list.length : i + 1;
  });
  readonly incompleteSetCount = computed(
    () => this.active()?.exercises.reduce((n, e) => n + e.sets.filter((s) => !s.completed).length, 0) ?? 0,
  );

  readonly completedSetCount = computed(
    () => this.active()?.exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0) ?? 0,
  );

  /** Live PR flags for completed sets, keyed by set id. */
  readonly livePrs = computed(() => {
    const s = this.active();
    return s ? flagPrSets(s, this.history.sessions()) : new Map();
  });

  isExerciseDone(e: SessionExercise): boolean {
    return e.sets.length > 0 && e.sets.every((s) => s.completed);
  }

  letterFor(ex: SessionExercise): string | null {
    const view = this.groups().find((g) => g.group.id === ex.groupId);
    if (!view || !view.isSuperset) return null;
    return SUPERSET_LETTERS[view.exercises.findIndex((e) => e.id === ex.id)] ?? null;
  }

  start(routineId: string): void {
    const routine = this.library.routine(routineId);
    if (!routine) return;
    const groups: SessionGroup[] = [];
    const exercises: SessionExercise[] = [];
    for (const block of routine.blocks) {
      const groupId = uid('grp');
      groups.push({ id: groupId, restSeconds: block.restSeconds });
      for (const re of block.exercises) {
        exercises.push({
          id: uid('sex'),
          exerciseId: re.exerciseId,
          groupId,
          notes: '',
          sets: Array.from({ length: re.sets }, (_, i) => newSet(i + 1)),
        });
      }
    }
    this.rest.skip();
    this.active.set({
      id: uid('ses'),
      routineId,
      name: routine.name,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: 'active',
      groups,
      exercises,
    });
    this.queueSync();
  }

  startEmpty(): void {
    this.rest.skip();
    this.active.set({
      id: uid('ses'), routineId: null, name: 'Workout', startedAt: new Date().toISOString(),
      endedAt: null, status: 'active', groups: [], exercises: [],
    });
    this.queueSync();
  }

  private mutate(fn: (s: WorkoutSession) => WorkoutSession): void {
    this.active.update((s) => (s ? fn(structuredClone(s)) : s));
    this.queueSync();
  }

  private mutateExercise(exId: string, fn: (e: SessionExercise) => void): void {
    this.mutate((s) => {
      const e = s.exercises.find((x) => x.id === exId);
      if (e) fn(e);
      return s;
    });
  }

  updateSet(exId: string, setId: string, patch: Partial<Pick<SetEntry, 'weightKg' | 'reps'>>): void {
    this.mutateExercise(exId, (e) => {
      const set = e.sets.find((x) => x.id === setId);
      if (set) Object.assign(set, patch);
    });
  }

  completeSet(exId: string, setId: string, weightKg: number, reps: number, effort: Effort): void {
    this.mutateExercise(exId, (e) => {
      const set = e.sets.find((x) => x.id === setId);
      if (!set) return;
      Object.assign(set, { weightKg, reps, effort, completed: true, completedAt: new Date().toISOString() });
    });
    this.maybeStartRest(exId, setId);
  }

  /** Changes the rating of an already completed set, without restarting rest. */
  setEffort(exId: string, setId: string, effort: Effort): void {
    this.mutateExercise(exId, (e) => {
      const set = e.sets.find((x) => x.id === setId);
      if (set) set.effort = effort;
    });
  }

  uncompleteSet(exId: string, setId: string): void {
    this.mutateExercise(exId, (e) => {
      const set = e.sets.find((x) => x.id === setId);
      if (set) Object.assign(set, { completed: false, completedAt: null, effort: null });
    });
  }

  /** Rest starts once every exercise in the group has finished this set number. */
  private maybeStartRest(exId: string, setId: string): void {
    const s = this.active();
    if (!s) return;
    const ex = s.exercises.find((e) => e.id === exId)!;
    const setNumber = ex.sets.find((x) => x.id === setId)!.setNumber;
    const view = this.groups().find((g) => g.group.id === ex.groupId)!;
    const roundDone = view.exercises.every((e) => e.sets.find((x) => x.setNumber === setNumber)?.completed ?? true);
    const workoutDone = s.exercises.every((e) => this.isExerciseDone(e));
    if (!roundDone || workoutDone) return;
    this.rest.start(view.group.id, this.nextUpLabel(view, setNumber), view.group.restSeconds);
  }

  /** What comes after this rest: the next round of the group, else the next group. */
  private nextUpLabel(view: ExerciseGroupView, setNumber: number): string {
    const first = view.exercises[0];
    if (first.sets.some((x) => x.setNumber === setNumber + 1 && !x.completed)) {
      const letter = view.isSuperset ? 'A' : '';
      return `Next: ${setNumber + 1}${letter} ${this.library.exercise(first.exerciseId).name}`;
    }
    const next = this.groups().slice(view.index + 1).find((g) => g.exercises.some((e) => !this.isExerciseDone(e)));
    return next ? `Next: ${this.library.exercise(next.exercises[0].exerciseId).name}` : 'Last round done';
  }

  /** Adds a set to every exercise in the group so supersets keep their A/B pairing. */
  addSet(groupId: string): void {
    this.mutate((s) => {
      for (const e of s.exercises.filter((x) => x.groupId === groupId)) {
        const n = Math.max(0, ...e.sets.map((x) => x.setNumber)) + 1;
        e.sets.push(newSet(n));
      }
      return s;
    });
  }

  /** Removes the set number from every exercise in the group, then renumbers. */
  removeSet(groupId: string, setNumber: number): void {
    this.mutate((s) => {
      for (const e of s.exercises.filter((x) => x.groupId === groupId)) {
        e.sets = e.sets.filter((x) => x.setNumber !== setNumber).map((x, i) => ({ ...x, setNumber: i + 1 }));
      }
      return s;
    });
  }

  setNotes(exId: string, notes: string): void {
    this.mutateExercise(exId, (e) => (e.notes = notes));
  }

  setRest(groupId: string, seconds: number): void {
    this.mutate((s) => {
      const g = s.groups.find((x) => x.id === groupId);
      if (g) g.restSeconds = Math.max(15, seconds);
      return s;
    });
  }

  /** Swapping clears the logged values: the new exercise brings its own history. */
  swapExercise(exId: string, newExerciseId: string): void {
    this.mutateExercise(exId, (e) => {
      e.exerciseId = newExerciseId;
      e.notes = '';
      e.sets = e.sets.map((x) => newSet(x.setNumber));
    });
  }

  splitSuperset(groupId: string): void {
    this.mutate((s) => {
      const gi = s.groups.findIndex((g) => g.id === groupId);
      const group = s.groups[gi];
      const members = s.exercises.filter((e) => e.groupId === groupId);
      const newGroups = members.map((e, i) => {
        if (i === 0) return group;
        const g = { id: uid('grp'), restSeconds: group.restSeconds };
        e.groupId = g.id;
        return g;
      });
      s.groups.splice(gi, 1, ...newGroups);
      return this.orderExercises(s);
    });
  }

  /** Joins a group with the one after it into a superset. */
  joinWithNext(groupId: string): void {
    this.mutate((s) => {
      const gi = s.groups.findIndex((g) => g.id === groupId);
      const next = s.groups[gi + 1];
      if (!next) return s;
      s.exercises.filter((e) => e.groupId === next.id).forEach((e) => (e.groupId = groupId));
      // Pad set counts so every exercise has the same number of rounds.
      const members = s.exercises.filter((e) => e.groupId === groupId);
      const rounds = Math.max(...members.map((e) => e.sets.length));
      members.forEach((e) => {
        while (e.sets.length < rounds) e.sets.push(newSet(e.sets.length + 1));
      });
      s.groups.splice(gi + 1, 1);
      return this.orderExercises(s);
    });
  }

  moveGroup(groupId: string, delta: -1 | 1): void {
    this.mutate((s) => {
      const i = s.groups.findIndex((g) => g.id === groupId);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= s.groups.length) return s;
      [s.groups[i], s.groups[j]] = [s.groups[j], s.groups[i]];
      return this.orderExercises(s);
    });
  }

  removeExercise(exId: string): void {
    this.mutate((s) => {
      const ex = s.exercises.find((e) => e.id === exId);
      if (!ex) return s;
      s.exercises = s.exercises.filter((e) => e.id !== exId);
      if (!s.exercises.some((e) => e.groupId === ex.groupId)) {
        s.groups = s.groups.filter((g) => g.id !== ex.groupId);
      }
      return s;
    });
  }

  addExercise(exerciseId: string): void {
    this.mutate((s) => {
      const groupId = uid('grp');
      s.groups.push({ id: groupId, restSeconds: 90 });
      s.exercises.push({
        id: uid('sex'), exerciseId, groupId, notes: '', sets: [newSet(1), newSet(2), newSet(3)],
      });
      return s;
    });
  }

  private orderExercises(s: WorkoutSession): WorkoutSession {
    s.exercises = s.groups.flatMap((g) => s.exercises.filter((e) => e.groupId === g.id));
    return s;
  }

  /**
   * Ends the workout. Completed sets are saved to history (incomplete sets and empty
   * exercises are dropped). Returns straight away; if the save fails, the workout is
   * reopened so nothing is lost.
   */
  finish(): { session: WorkoutSession } | null {
    const s = this.active();
    if (!s) return null;
    clearTimeout(this.syncTimer);
    const exercises = s.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((x) => x.completed) }))
      .filter((e) => e.sets.length > 0);
    const groups = s.groups.filter((g) => exercises.some((e) => e.groupId === g.id));
    const done: WorkoutSession = { ...s, exercises, groups, status: 'completed', endedAt: new Date().toISOString() };
    this.rest.skip();
    this.active.set(null);

    if (!exercises.length) {
      this.enqueue(() => this.api.delete('/sessions/active')).catch(() => undefined);
      return { session: done };
    }
    this.enqueue(() => this.history.save(done)).catch((err) => {
      this.active.set(s);
      this.notify.show(describeError(err, `Couldn't save ${s.name}. It's still open, so you can finish it again.`));
    });
    return { session: done };
  }

  discard(): void {
    clearTimeout(this.syncTimer);
    const s = this.active();
    this.rest.skip();
    this.active.set(null);
    if (!s) return;
    this.enqueue(() => this.api.delete('/sessions/active')).catch((err) => this.notify.saveFailed(err, 'the discard'));
  }
}
