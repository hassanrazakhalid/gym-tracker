import { Inject, Injectable } from '@nestjs/common';
import type { CollectionReference, DocumentReference, Firestore } from 'firebase-admin/firestore';
import type { AuthUser } from '../auth/auth.js';
import { Goal, Unit } from '../domain/models.js';
import { addDays, isoDate, LB_PER_KG } from '../domain/util.js';
import { FIRESTORE } from '../firebase/firebase.module.js';
import { LibraryService } from '../library/library.js';

export interface UserDoc {
  name: string;
  unit: Unit;
  stepGoal: number;
  weekPlan: (string | null)[];
  goal: Goal;
  lessonsDone: string[];
  createdAt: string;
}

/** Sub-collections under users/{uid}. */
export type UserCollection =
  | 'routines'
  | 'sessions'
  | 'records'
  | 'bodyWeight'
  | 'foods'
  | 'checkIns'
  | 'steps'
  | 'photos'
  | 'active';

/**
 * Owns the users/{uid} document and gives other services scoped references,
 * so no query can reach another user's data.
 */
@Injectable()
export class UsersService {
  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly library: LibraryService,
  ) {}

  doc(uid: string): DocumentReference {
    return this.db.collection('users').doc(uid);
  }

  col(uid: string, name: UserCollection): CollectionReference {
    return this.doc(uid).collection(name);
  }

  /** Reads the profile, creating it with sensible defaults on first sign-in. */
  async getOrCreate(user: AuthUser): Promise<UserDoc> {
    const ref = this.doc(user.uid);
    const snap = await ref.get();
    if (snap.exists) return snap.data() as UserDoc;
    const created = this.defaults(user);
    await ref.set(created);
    return created;
  }

  async update(uid: string, patch: Partial<UserDoc>): Promise<void> {
    await this.doc(uid).set(patch, { merge: true });
  }

  /** Deletes all of a user's data, profile included. */
  async wipe(uid: string): Promise<void> {
    await this.db.recursiveDelete(this.doc(uid));
  }

  defaults(user: AuthUser, now = new Date()): UserDoc {
    const fallbackName = user.email?.split('@')[0] ?? 'there';
    return {
      name: (user.name ?? fallbackName).slice(0, 60),
      unit: 'lb',
      stepGoal: 10_000,
      weekPlan: [...this.library.defaultWeekPlan],
      goal: {
        type: 'maintain',
        pace: 'moderate',
        weeklyRateKg: 0,
        startDate: isoDate(now),
        startingWeightKg: 180 / LB_PER_KG,
        dailyCalories: 2200,
      },
      lessonsDone: [],
      createdAt: now.toISOString(),
    };
  }

  /** Goal used by demo data: losing about 1 lb a week for the last 10 weeks. */
  demoGoal(today: Date): Goal {
    return {
      type: 'lose-fat',
      pace: 'moderate',
      weeklyRateKg: -1 / LB_PER_KG,
      startDate: isoDate(addDays(today, -70)),
      startingWeightKg: 196.4 / LB_PER_KG,
      dailyCalories: 2250,
    };
  }
}
