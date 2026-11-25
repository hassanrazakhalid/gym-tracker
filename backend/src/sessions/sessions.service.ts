import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { WorkoutSession } from '../domain/models.js';
import { flagPrSets } from '../domain/records.js';
import { LibraryService } from '../library/library.js';
import { UsersService } from '../users/users.service.js';

/** A finished session as stored: the session plus fields that make it queryable. */
export interface StoredSession extends WorkoutSession {
  /** Distinct exercise ids, for "sessions that included X" queries. */
  exerciseIds: string[];
  /** Sets that were personal records when the session was saved. */
  prSetIds: string[];
}

const ACTIVE_DOC = 'current';

@Injectable()
export class SessionsService {
  constructor(
    private readonly users: UsersService,
    private readonly library: LibraryService,
  ) {}

  // ------------------------------------------------------------ active workout

  async getActive(uid: string): Promise<WorkoutSession | null> {
    const snap = await this.users.col(uid, 'active').doc(ACTIVE_DOC).get();
    return snap.exists ? (snap.data() as WorkoutSession) : null;
  }

  async putActive(uid: string, session: WorkoutSession): Promise<WorkoutSession> {
    this.assertKnownExercises(session);
    const active = { ...session, status: 'active' as const, endedAt: null };
    await this.users.col(uid, 'active').doc(ACTIVE_DOC).set(active);
    return active;
  }

  async discardActive(uid: string): Promise<void> {
    await this.users.col(uid, 'active').doc(ACTIVE_DOC).delete();
  }

  /**
   * Saves a finished workout to history and clears the active one. Only completed
   * sets are kept; exercises with none are dropped. Safe to retry: finishing the
   * same session id twice returns the first result.
   */
  async finish(uid: string, session: WorkoutSession): Promise<StoredSession | null> {
    this.assertKnownExercises(session);
    const sessions = this.users.col(uid, 'sessions');
    const existing = await sessions.doc(session.id).get();
    if (existing.exists) return existing.data() as StoredSession;

    const exercises = session.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.completed && s.reps != null) }))
      .filter((e) => e.sets.length > 0);
    const activeRef = this.users.col(uid, 'active').doc(ACTIVE_DOC);

    if (!exercises.length) {
      await activeRef.delete();
      return null;
    }

    const completed: WorkoutSession = {
      ...session,
      exercises,
      groups: session.groups.filter((g) => exercises.some((e) => e.groupId === g.id)),
      status: 'completed',
      endedAt: session.endedAt ?? new Date().toISOString(),
    };
    const exerciseIds = [...new Set(exercises.map((e) => e.exerciseId))];
    const prior = await this.priorSessionsWith(uid, exerciseIds, completed.startedAt);
    const flags = flagPrSets(completed, prior);

    const stored: StoredSession = { ...completed, exerciseIds, prSetIds: [...flags.keys()] };

    const batch = sessions.firestore.batch();
    batch.set(sessions.doc(stored.id), stored);
    for (const [setId, f] of flags) {
      for (const metric of f.metrics) {
        const value = metric === 'weight' ? f.weightKg : metric === 'reps' ? f.reps : f.weightKg * f.reps;
        batch.set(this.users.col(uid, 'records').doc(`${stored.id}_${setId}_${metric}`), {
          exerciseId: f.exerciseId,
          metric,
          value,
          sessionId: stored.id,
          achievedAt: f.at ?? stored.endedAt,
        });
      }
    }
    batch.delete(activeRef);
    await batch.commit();
    return stored;
  }

  // ------------------------------------------------------------ history

  async list(uid: string, limit: number): Promise<StoredSession[]> {
    const snap = await this.users.col(uid, 'sessions').orderBy('startedAt', 'desc').limit(limit).get();
    return snap.docs.map((d) => d.data() as StoredSession);
  }

  async get(uid: string, id: string): Promise<StoredSession> {
    const snap = await this.users.col(uid, 'sessions').doc(id).get();
    if (!snap.exists) throw new NotFoundException('That workout was not found.');
    return snap.data() as StoredSession;
  }

  async remove(uid: string, id: string): Promise<void> {
    const col = this.users.col(uid, 'records');
    const records = await col.where('sessionId', '==', id).get();
    const batch = col.firestore.batch();
    records.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(this.users.col(uid, 'sessions').doc(id));
    await batch.commit();
  }

  /** Earlier sessions containing any of the exercises (Firestore allows 30 values per query). */
  private async priorSessionsWith(uid: string, exerciseIds: string[], before: string): Promise<WorkoutSession[]> {
    const col = this.users.col(uid, 'sessions');
    const byId = new Map<string, WorkoutSession>();
    for (let i = 0; i < exerciseIds.length; i += 30) {
      const snap = await col.where('exerciseIds', 'array-contains-any', exerciseIds.slice(i, i + 30)).get();
      for (const d of snap.docs) {
        const s = d.data() as WorkoutSession;
        if (s.startedAt < before) byId.set(s.id, s);
      }
    }
    return [...byId.values()];
  }

  private assertKnownExercises(session: WorkoutSession): void {
    const unknown = session.exercises.map((e) => e.exerciseId).filter((id) => !this.library.isExercise(id));
    if (unknown.length) throw new BadRequestException(`Unknown exercise: ${unknown.join(', ')}`);
    for (const e of session.exercises) {
      if (!session.groups.some((g) => g.id === e.groupId)) {
        throw new BadRequestException(`Exercise ${e.id} refers to a missing group ${e.groupId}.`);
      }
    }
  }
}
